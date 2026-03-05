import type { ApiResponse } from "@/global/types/apiResponse";
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";


// 환경변수로 API 기본 URL 설정
const apiBase = import.meta.env.VITE_APP_API_BASE;

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: apiBase,
  withCredentials: true, // 쿠키/세션 포함
});

api.interceptors.request.use(
  (config) => {
    const loadingStore = useLoadingStore();
    loadingStore.start();
    return config;
  },
  (error) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();
    return Promise.reject(error);
  }
);

/**
 * 응답 Interceptor
 *
 * 백엔드 응답 구조:
 *   AxiosResponse<ApiResponse<T>>
 *     └── .data  →  ApiResponse<T>  { success, status, message, data?: T, errorCode? }
 *                       └── .data  →  T  (실제 페이로드)
 *
 * 인터셉터에서 AxiosResponse를 벗겨 ApiResponse<T>를 반환하므로,
 * API 함수에서는 response.data 한 번만 접근하면 실제 페이로드 T를 얻을 수 있습니다.
 *
 *   const response = await api.get<ApiResponse<Foo>>(...)
 *   // response      → ApiResponse<Foo>
 *   // response.data → Foo
 */
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();
    return response.data as any;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();

    const { alert } = useAlert();
    const errorResponse = error.response?.data as ApiResponse<unknown>;

    if (errorResponse) {
      console.error(
        `[API Error] status: ${errorResponse.status} | errorCode: ${errorResponse.errorCode} | message: ${errorResponse.message}`
      );
      if (errorResponse.status === 400) {
        alert("Error", errorResponse.message);

      }
      else if (errorResponse.status === 401) {
        alert("Error", errorResponse.message);
      } else if (errorResponse.status === 404) {
        alert("Error", errorResponse.message);
      } else if (errorResponse.status === 500) {
        alert("Error", errorResponse.message);
      } else {
        alert("Error", errorResponse.message);
      }
    } else {
      alert("Unexpected error", error.message);
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
