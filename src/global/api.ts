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
    handledErrorStatuses?: number[];
  }
}

// Token Refresh 관련 변수
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const redirectToLoginIfProtectedRoute = () => {
  if (router.currentRoute.value.meta?.requiresAuth) {
    router.push(RouteHelper.auth.login());
  }
};

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
  async (config) => {
    const loadingStore = useLoadingStore();
    loadingStore.start();

    // accessToken을 헤더에 추가
    const { useAuthStore } = await import("@/auth/stores/auth");
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

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
    const originalRequest = error.config as any; // 인터셉터에서 config 재사용을 위해 캐스팅
    const skipAlert = originalRequest?.skipAlert;
    const handledErrorStatuses: number[] = originalRequest?.handledErrorStatuses ?? [];

    if (errorResponse) {
      console.error(
        `[API Error] status: ${errorResponse.status} | errorCode: ${errorResponse.errorCode} | message: ${errorResponse.message}`
      );
      
      // 401 에러 발생 시 토큰 갱신 로직 (refresh 요청 자체에서 난 에러는 제외)
      // _retry 플래그를 통해 무한 루프 방지. "이제 재시도를 할 것이니 다음번에 또 에러가 나더라도 재시도하지 마라"는 표시
      if (errorResponse.status === 401 && !originalRequest.url?.includes('/auth/refresh') && !originalRequest._retry) {
        // [A] 토큰 갱신을 시작하는 첫 번째 요청
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const { useAuthStore } = await import("@/auth/stores/auth");
            const authStore = useAuthStore();
            const refreshed = await authStore.silentRefresh();
            
            if (refreshed && authStore.accessToken) {
              // 토큰 갱신 성공 
              // 대기열에 있는 모든 요청들을 새로운 accessToken과 함께 재요청
              isRefreshing = false;
              onRefreshed(authStore.accessToken);
              
              originalRequest._retry = true;
              originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
              return api(originalRequest);
            } else {
              isRefreshing = false;
              authStore.resetAuthState();
              if (!skipAlert) await alert("로그인 만료", "세션이 만료되었습니다. 다시 로그인해주세요.");
              redirectToLoginIfProtectedRoute();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            isRefreshing = false;
            const { useAuthStore } = await import("@/auth/stores/auth");
            useAuthStore().resetAuthState();
            redirectToLoginIfProtectedRoute();
            return Promise.reject(refreshError);
          }
        }
        
        // [B] 이미 토큰 갱신 중일 때 들어온 다른 요청들
        // 새로운 Promise를 생성해 대기열 큐에 넣고, 갱신이 완료되면 resolve 되도록 함
        return new Promise((resolve) => { // 새로운 Promise를 반환하여 Pending 상태로 유지. resolve 호출되기 전까지 대기.
          addRefreshSubscriber((token: string) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // [A] 부분을 보면, 갱신 완료 시 onRefreshed 함수가 실행되어 refreshSubscribers 큐 내부의 익명함수들이 실행
            // 익명함수 내부에서 resolve 호출하여 Promise 완료 처리
            resolve(api(originalRequest));
          });
        });
      }

      // 특정 오류코드에 대해 전역 알림/라우팅이 처리하기 전에 호출자에게 되돌려서 페이지가 해당 에러를 처리함
      if (handledErrorStatuses.includes(errorResponse.status)) {
        return Promise.reject(error);
      }

      if (!skipAlert) {
        switch (errorResponse.status) {
          case 400:
            await alert("400 Bad Request", "잘못된 요청입니다");
            console.debug(errorResponse.message);
            break;
          case 401:
            await alert("401 Unauthorized", "인증 필요");
            console.debug(errorResponse.message);
            redirectToLoginIfProtectedRoute();
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
        // 단, 로그인 요청 등에서 발생한 에러는 자체 처리를 위해 자동 라우팅 방지
        if (!originalRequest.url?.includes('/auth/login')) {
          switch(errorResponse.status) {
            case 401:
              redirectToLoginIfProtectedRoute();
              break;
            case 404:
              router.back();
              break;
          }
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
