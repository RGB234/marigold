import type { ApiResponse } from "@/global/types/common";
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import router from "@/global/router";


// 환경변수로 API 기본 URL 설정
const apiBase = import.meta.env.VITE_API_V1_BASE;

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: apiBase,
  withCredentials: true, // 쿠키/세션 포함
});

/**
 * 요청 Interceptor
 */

api.interceptors.request.use(
  (config) => {
    const loadingStore = useLoadingStore();
    loadingStore.start();

    // // FormData가 아닌 일반 객체 데이터인 경우에만 json-bigint 적용
    // if (config.data && !(config.data instanceof FormData)) {
    //   config.data = JSONbig({ storeAsString: true }).stringify(config.data);
    //   config.headers['Content-Type'] = 'application/json';
    // }

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
 */
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();

    // // 응답 데이터가 문자열인 경우(JSON 등) json-bigint로 파싱 시도
    // if (response.data && typeof response.data === 'string') {
    //   try {
    //     response.data = JSONbig({ storeAsString: true }).parse(response.data);
    //   } catch (e) {
    //     // 파싱 실패 시 원본 데이터 유지
    //   }
    // }
    
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();

    const { alert } = useAlert();
    const errorResponse = error.response?.data;

    if (errorResponse) {
      console.error(
        `[API Error] status: ${errorResponse.status} | errorCode: ${errorResponse.errorCode} | message: ${errorResponse.message}`
      );
      switch (errorResponse.status) {
        case 400:
          await alert("Bad Request", errorResponse.message);
          break;
        case 401:
          await alert("Unauthorized", errorResponse.message);
          // 로그인 페이지로 이동하거나 로그아웃 처리
          router.push({ name: "Login" });
          break;
        case 404:
          await alert("Not Found", errorResponse.message);
          router.back();
          break;
        case 500:
          await alert("Internal Server Error", errorResponse.message);
          // router.back();
          break;
        default:
          await alert("Error", errorResponse.message);
          // router.back();
          break;
      }
    } else {
      await alert("Unexpected error", error.message);
      // router.back();
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
