import type { ApiResponse } from "@/global/types/common";
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import router from "@/global/router";
import {RouteHelper} from "@/global/router/routeHelper.ts";

// Axios Request Config 확장을 통해 커스텀 속성(skipAlert) 추가
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAlert?: boolean;
  }
}

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
 */
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const loadingStore = useLoadingStore();
    loadingStore.stop();

    const { alert } = useAlert();
    const errorResponse = error.response?.data;
    const skipAlert = error.config?.skipAlert; // skipAlert 플래그 확인

    if (errorResponse) {
      console.error(
        `[API Error] status: ${errorResponse.status} | errorCode: ${errorResponse.errorCode} | message: ${errorResponse.message}`
      );
      
      // skipAlert가 true가 아닐 때만 전역 알림 표시
      if (!skipAlert) {
        switch (errorResponse.status) {
          case 400:
            await alert("400 Bad Request", "잘못된 요청입니다");
            console.debug(errorResponse.message);
            break;
          case 401:
            await alert("401 Unauthorized", "인증 필요");
            console.debug(errorResponse.message);
            router.push(RouteHelper.auth.login());
            break;
          case 404:
            await alert("404 Not Found", "페이지를 찾을 수 없습니다");
            console.debug(errorResponse.message);
            router.back();
            break;
          case 500:
            await alert("500 Internal Server Error", "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            console.debug(errorResponse.message);
            break;
          default:
            await alert("Error " + errorResponse.status, "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            console.debug(errorResponse.message);
            break;
        }
      } else {
        // 인증 에러면서 skipAlert가 설정되어 있어도, 라우팅 처리는 필요한 경우
        switch(errorResponse.status) {
          case 401:
            router.push(RouteHelper.auth.login());
            break;
          case 404:
            router.back();
        }
      }
    } else {
      if (!skipAlert) {
        await alert("Error " + error.status, "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        console.debug(error.message);
      }
    }

    // 호출한 측에서 에러 객체를 그대로 활용할 수 있도록 리턴 (error.response.data에 접근 가능)
    return Promise.reject(error);
  }
);

export default api;
