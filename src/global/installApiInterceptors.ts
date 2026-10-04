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
  request: RetriableRequestConfig | undefined,
): request is RetriableRequestConfig =>
  error.type === "api" &&
  error.status === 401 &&
  !!request &&
  !request._retry &&
  !request.skipAuthRefresh &&
  !request.url?.includes("/auth/refresh") &&
  !!problemCode &&
  REFRESHABLE_AUTH_ERRORS.has(problemCode);

const presentGlobalError = async (error: AppError): Promise<void> => {
  if (error.type === "cancelled") {
    return;
  }

  const { alert } = useAlert();
  if (error.type === "network") {
    await alert("네트워크 오류", "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
    return;
  }
  if (error.type === "timeout") {
    await alert("요청 시간 초과", "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  if (error.type === "unknown") {
    await alert("오류", "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  const detail = getErrorMessage(error.problem, "") || undefined;
  if (error.status === 410 && error.problem?.errorCode === "ADOPTION_POST_DELETED") {
    await router.replace(RouteHelper.adoption.deleted());
    return;
  }
  if (error.problem?.errorCode === ErrorCodes.AUTH_RECENT_AUTH_REQUIRED) {
    clearSecurityAccess();
    await router.replace(RouteHelper.user.securityVerify());
    return;
  }

  switch (error.status) {
    case 400:
      await alert("요청 확인", detail ?? "입력값 또는 요청 내용을 확인해주세요.");
      break;
    case 401:
      await alert("인증 필요", detail ?? "로그인이 필요합니다.");
      redirectToLoginIfProtectedRoute();
      break;
    case 403:
      await alert("권한 없음", detail ?? "요청을 수행할 권한이 없습니다.");
      break;
    case 404:
      await alert("찾을 수 없음", detail ?? "요청한 리소스를 찾을 수 없습니다.");
      break;
    case 409:
      await alert("요청 충돌", detail ?? "현재 상태에서는 요청을 처리할 수 없습니다.");
      break;
    case 410:
      await alert("삭제된 리소스", detail ?? "이미 삭제된 리소스입니다.");
      break;
    case 413:
      await alert("업로드 제한 초과", detail ?? "업로드 가능한 크기를 초과했습니다.");
      break;
    default:
      await alert(
        error.status >= 500 ? "서버 오류" : `오류 ${error.status}`,
        detail ?? "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
  }
};

export function installApiInterceptors(apiClient: AxiosInstance, authStore: AuthStore): void {
  const refreshCoordinator = new RefreshCoordinator<string>();
  const refreshAccessToken = (): Promise<string> =>
    refreshCoordinator.run(async () => {
      const refreshed = await authStore.silentRefresh();
      if (refreshed && authStore.accessToken) {
        return authStore.accessToken;
      }

      authStore.resetAuthState();
      const { alert } = useAlert();
      void alert("로그인 만료", "세션이 만료되었습니다. 다시 로그인해주세요.");
      redirectToLoginIfProtectedRoute();
      throw new Error("Session refresh failed");
    });

  apiClient.interceptors.request.use(
    async (config) => {
      useLoadingStore().start();

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

      const error = normalizeApiError(axiosError);
      const request = axiosError.config as RetriableRequestConfig | undefined;
      const problemCode = error.type === "api" ? error.problem?.errorCode : undefined;

      if (error.type === "api") {
        logger.error(
          `[API Error] status=${error.status} errorCode=${problemCode ?? "UNKNOWN"} requestId=${error.problem?.requestId ?? "UNKNOWN"}`,
        );
      } else {
        logger.error(`[API Error] type=${error.type}`);
      }

      if (shouldRefresh(error, problemCode, request)) {
        try {
          const token = await refreshAccessToken();
          request._retry = true;
          request.headers.Authorization = `Bearer ${token}`;
          return apiClient(request);
        } catch {
          return Promise.reject(axiosError);
        }
      }

      if (request?.errorMode !== "local") {
        await presentGlobalError(error);
      }
      return Promise.reject(axiosError);
    },
  );
}
