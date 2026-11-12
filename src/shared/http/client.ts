import axios, { type AxiosInstance } from "axios";

export const API_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 60_000;

declare module "axios" {
  export interface AxiosRequestConfig {
    /** 인증 API처럼 401이어도 access token 갱신을 시도하지 않는 요청입니다. */
    skipAuthRefresh?: boolean;
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_V1_BASE,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});

export default apiClient;
