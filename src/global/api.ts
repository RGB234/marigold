import type { ApiResponse } from "@/global/types/common";
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import router from "@/global/router";
import {Navigator} from "@/global/router/routeHelper.ts";

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
            await alert("요청 오류", errorResponse.message);
            break;
          case 401:
            await alert("인증 필요", errorResponse.message);
            router.push(Navigator.auth.login());
            break;
          case 404:
            await alert("찾을 수 없음", errorResponse.message);
            router.back();
            break;
          case 500:
            await alert("서버 오류", errorResponse.message);
            break;
          default:
            await alert("오류", errorResponse.message);
            break;
        }
      } else {
        // 인증 에러면서 skipAlert가 설정되어 있어도, 라우팅 처리는 필요한 경우
        switch(errorResponse.status) {
          case 401:
            router.push(Navigator.auth.login());
            break;
          case 404:
            router.back();
        }
      }
    } else {
      if (!skipAlert) {
        await alert("네트워크 오류", error.message);
      }
    }

    // 호출한 측에서 에러 객체를 그대로 활용할 수 있도록 수정 (error.response.data에 접근 가능)
    return Promise.reject(error);
  }
);

export default api;
