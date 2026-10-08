import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { useAuthStore } from "@/auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { ErrorCodes } from "@/global/errorCodes";
import { getErrorMessage } from "@/global/i18n/errorMessages";
import { logger } from "@/global/logger";
import { RefreshCoordinator } from "@/global/refreshCoordinator";
import router from "@/global/router";
import { RouteHelper } from "@/global/router/routeHelper";
import { useLoadingStore } from "@/global/stores/loading";
import { normalizeApiError, type AppError } from "@/global/utils/apiError";
import { clearSecurityAccess } from "@/user/utils/securityAccess";
import {
  cacheCsrfToken,
  CSRF_TOKEN_HEADER_NAME,
  getCsrfToken,
  type ApiErrorMode,
  API_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
} from "@/global/apiClient";

type AuthStore = ReturnType<typeof useAuthStore>;

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  errorMode?: ApiErrorMode;
  skipAuthRefresh?: boolean;
};

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REFRESHABLE_AUTH_ERRORS = new Set<string>([
  ErrorCodes.AUTH_UNAUTHORIZED,
  ErrorCodes.AUTH_TOKEN_INVALID,
  ErrorCodes.AUTH_TOKEN_EXPIRED,
]);

const redirectToLoginIfProtectedRoute = () => {
  if (router.currentRoute.value.meta?.requiresAuth) {
    void router.push(RouteHelper.auth.login());
  }
};

const shouldRefresh = (
  error: AppError,
  problemCode: string | undefined,
  request: RetriableRequestConfig,
): boolean =>
  error.type === "api" &&
  error.status === 401 &&
  !request._retry &&
  !request.skipAuthRefresh &&
  !request.url?.includes("/auth/refresh") &&
  !!problemCode &&
  REFRESHABLE_AUTH_ERRORS.has(problemCode);

const presentGlobalError = (error: AppError): void => {
  if (error.type === "cancelled") {
    return;
  }

  const { alert } = useAlert();
  if (error.type === "network") {
    void alert("네트워크 오류", "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
    return;
  }
  if (error.type === "timeout") {
    void alert("요청 시간 초과", "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  if (error.type === "unknown") {
    void alert("오류", "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  const detail = getErrorMessage(error.problem, "") || undefined;
  if (error.status === 410 && error.problem?.errorCode === "ADOPTION_POST_DELETED") {
    void router.replace(RouteHelper.adoption.deleted());
    return;
  }
  if (error.problem?.errorCode === ErrorCodes.AUTH_RECENT_AUTH_REQUIRED) {
    clearSecurityAccess();
    void router.replace(RouteHelper.user.securityVerify());
    return;
  }

  switch (error.status) {
    case 400:
      void alert("요청 확인", detail ?? "입력값 또는 요청 내용을 확인해주세요.");
      break;
    case 401:
      void alert("인증 필요", detail ?? "로그인이 필요합니다.");
      redirectToLoginIfProtectedRoute();
      break;
    case 403:
      void alert("권한 없음", detail ?? "요청을 수행할 권한이 없습니다.");
      break;
    case 404:
      void alert("찾을 수 없음", detail ?? "요청한 리소스를 찾을 수 없습니다.");
      break;
    case 409:
      void alert("요청 충돌", detail ?? "현재 상태에서는 요청을 처리할 수 없습니다.");
      break;
    case 410:
      void alert("삭제된 리소스", detail ?? "이미 삭제된 리소스입니다.");
      break;
    case 413:
      void alert("업로드 제한 초과", detail ?? "업로드 가능한 크기를 초과했습니다.");
      break;
    default:
      void alert(
        error.status >= 500 ? "서버 오류" : `오류 ${error.status}`,
        detail ?? "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
  }
};

export function installApiInterceptors(apiClient: AxiosInstance, authStore: AuthStore): void {
  const refreshCoordinator = new RefreshCoordinator<string | null>();
  const refreshAccessToken = (): Promise<string | null> =>
    refreshCoordinator.run(async () => {
      const refreshed = await authStore.silentRefresh();
      if (refreshed && authStore.accessToken) {
        return authStore.accessToken;
      }

      authStore.resetAuthState();
      redirectToLoginIfProtectedRoute();
      return null;
    });

  apiClient.interceptors.request.use(
    async (config) => {
      useLoadingStore().start();

      if (config.data instanceof FormData && config.timeout === API_TIMEOUT_MS) {
        config.timeout = UPLOAD_TIMEOUT_MS;
      }

      if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`;
      }

      const method = config.method?.toUpperCase();
      const csrfToken = getCsrfToken();
      if (method && CSRF_PROTECTED_METHODS.has(method) && csrfToken) {
        config.headers[CSRF_TOKEN_HEADER_NAME] = csrfToken;
      }
      return config;
    },
    (error) => {
      useLoadingStore().stop();
      return Promise.reject(error);
    },
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse<unknown>) => {
      useLoadingStore().stop();
      cacheCsrfToken(response.headers[CSRF_TOKEN_HEADER_NAME.toLowerCase()]);
      return response;
    },
    async (axiosError: AxiosError<unknown>) => {
      useLoadingStore().stop();
      cacheCsrfToken(axiosError.response?.headers?.[CSRF_TOKEN_HEADER_NAME.toLowerCase()]);

      let failure: unknown = axiosError;
      let error = normalizeApiError(axiosError);
      const request = axiosError.config as RetriableRequestConfig | undefined;
      const problemCode = error.type === "api" ? error.problem?.errorCode : undefined;

      if (error.type === "api") {
        logger.error(
          `[API Error] status=${error.status} errorCode=${problemCode ?? "UNKNOWN"} requestId=${error.problem?.requestId ?? "UNKNOWN"}`,
        );
      } else {
        logger.error(`[API Error] type=${error.type}`);
      }

      if (request && shouldRefresh(error, problemCode, request)) {
        try {
          const token = await refreshAccessToken();
          if (token) {
            request._retry = true;
            request.headers.Authorization = `Bearer ${token}`;
            return apiClient(request);
          }
        } catch (refreshError) {
          failure = refreshError;
          error = normalizeApiError(refreshError);
        }
      }

      if (request?.errorMode !== "local") {
        presentGlobalError(error);
      }
      return Promise.reject(failure);
    },
  );
}
