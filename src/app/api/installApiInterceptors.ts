import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { useAuthStore } from "@/auth/stores/auth";
import { ErrorCodes } from "@/global/errorCodes";
import { logger } from "@/global/logger";
import { normalizeApiError, type AppError } from "@/shared/errors/apiError";
import {
  cacheCsrfToken,
  CSRF_TOKEN_HEADER_NAME,
  getCsrfToken,
  API_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
} from "@/shared/api/apiClient";

type AuthStore = ReturnType<typeof useAuthStore>;

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REFRESHABLE_AUTH_ERRORS = new Set<string>([
  ErrorCodes.AUTH_UNAUTHORIZED,
  ErrorCodes.AUTH_TOKEN_INVALID,
  ErrorCodes.AUTH_TOKEN_EXPIRED,
]);

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

export function installApiInterceptors(apiClient: AxiosInstance, authStore: AuthStore): void {
  const refreshAccessToken = async (): Promise<string | null> => {
    return authStore.refreshAccessToken();
  };

  apiClient.interceptors.request.use(
    async (config) => {
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
    (error) => Promise.reject(error),
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse<unknown>) => {
      cacheCsrfToken(response.headers[CSRF_TOKEN_HEADER_NAME.toLowerCase()]);
      return response;
    },
    async (axiosError: AxiosError<unknown>) => {
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

      return Promise.reject(failure);
    },
  );
}
