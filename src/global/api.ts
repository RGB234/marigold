import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { useAlert } from "@/global/composables/useAlert";
import { ErrorCodes } from "@/global/errorCodes";
import { logger } from "@/global/logger";
import { RefreshCoordinator } from "@/global/refreshCoordinator";
import router from "@/global/router";
import { RouteHelper } from "@/global/router/routeHelper";
import { useLoadingStore } from "@/global/stores/loading";
import { normalizeApiError, type AppError } from "@/global/utils/apiError";

export type ApiErrorMode = "global" | "local";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** global이면 공통 알림, local이면 호출 화면이 직접 오류를 표현합니다. */
    errorMode?: ApiErrorMode;
    /** 인증 API처럼 401이어도 access token 갱신을 시도하지 않는 요청입니다. */
    skipAuthRefresh?: boolean;
  }
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  errorMode?: ApiErrorMode;
  skipAuthRefresh?: boolean;
};

const apiBase = import.meta.env.VITE_API_V1_BASE;
export const CSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_TOKEN_HEADER_NAME = "X-CSRF-TOKEN";
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REFRESHABLE_AUTH_ERRORS = new Set<string>([
  ErrorCodes.AUTH_UNAUTHORIZED,
  ErrorCodes.AUTH_TOKEN_INVALID,
  ErrorCodes.AUTH_TOKEN_EXPIRED,
]);
const refreshCoordinator = new RefreshCoordinator<string>();
let csrfTokenCache: string | null = null;

export const getCsrfToken = (): string | null =>
  csrfTokenCache ?? Cookies.get(CSRF_TOKEN_COOKIE_NAME) ?? null;

const api: AxiosInstance = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

const redirectToLoginIfProtectedRoute = () => {
  if (router.currentRoute.value.meta?.requiresAuth) {
    void router.push(RouteHelper.auth.login());
  }
};

const refreshAccessToken = (): Promise<string> =>
  refreshCoordinator.run(async () => {
    const { useAuthStore } = await import("@/auth/stores/auth");
    const authStore = useAuthStore();
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

  const detail = error.problem?.detail;
  if (error.problem?.errorCode === ErrorCodes.AUTH_RECENT_AUTH_REQUIRED) {
    const { clearSecurityAccess } = await import("@/user/utils/securityAccess");
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

api.interceptors.request.use(
  async (config) => {
    useLoadingStore().start();

    const { useAuthStore } = await import("@/auth/stores/auth");
    const accessToken = useAuthStore().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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

api.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    useLoadingStore().stop();
    csrfTokenCache = response.headers[CSRF_TOKEN_HEADER_NAME.toLowerCase()] ?? csrfTokenCache;
    return response;
  },
  async (axiosError: AxiosError<unknown>) => {
    useLoadingStore().stop();
    csrfTokenCache =
      axiosError.response?.headers?.[CSRF_TOKEN_HEADER_NAME.toLowerCase()] ?? csrfTokenCache;

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
        return api(request);
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

export default api;
