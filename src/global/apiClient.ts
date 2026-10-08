import axios, { type AxiosInstance } from "axios";
import Cookies from "js-cookie";

export type ApiErrorMode = "global" | "local";
export const API_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 60_000;

declare module "axios" {
  export interface AxiosRequestConfig {
    /** global이면 공통 알림, local이면 호출 화면이 직접 오류를 표현합니다. */
    errorMode?: ApiErrorMode;
    /** 인증 API처럼 401이어도 access token 갱신을 시도하지 않는 요청입니다. */
    skipAuthRefresh?: boolean;
  }
}

export const CSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_TOKEN_HEADER_NAME = "X-CSRF-TOKEN";

let csrfTokenCache: string | null = null;

export const getCsrfToken = (): string | null =>
  csrfTokenCache ?? Cookies.get(CSRF_TOKEN_COOKIE_NAME) ?? null;

export const cacheCsrfToken = (token: string | null | undefined): void => {
  csrfTokenCache = token ?? csrfTokenCache;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_V1_BASE,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});

export default apiClient;
