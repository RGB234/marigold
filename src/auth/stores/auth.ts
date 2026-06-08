import { defineStore } from "pinia";
import { validBASE32 } from "@/global/utils/validators";
import api from "@/global/api";
import { ApiResponse } from "@/global/types/common";
import {TSID_String} from "@/global/types/common.ts";
import {
  clearPendingAuthState,
  savePendingAuthState,
  type PendingAuthState,
} from "@/auth/utils/pendingAuth";
import { clearSecurityAccess } from "@/user/utils/securityAccess";


export enum ProviderInfo {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

interface OAuthLoginOptions extends Partial<PendingAuthState> {
  action?: "link";
}

interface AuthStatusResponse {
  userId: string | null;
  authorities: string[];
  refreshTokenPresent: boolean;
}

/*
  HttpOnly Cookie를 사용하여 인증 상태 관리
  프론트엔드 UI 업데이트를 위한 최소한의 인증 정보를 백엔드에 요청해서 저장
*/

export const useAuthStore = defineStore("auth", {
  state: () => ({
    id: null as TSID_String | null,
    authorities: [] as string[],
    accessToken: null as string | null,
  }),
  
  getters: {
    // 로그인 여부 확인
    isLoggedIn: (state) => {
      return validBASE32(state.id) && !!state.accessToken;
    },
    userId: (state) => state.id, // String format TSID
    // 권한 목록
    userAuthorities: (state) => state.authorities,
    // 특정 권한 보유 여부 확인
    hasAnyAuthority: (state) => (authorities: string[]) => {
      for (const auth of authorities) {
        if (state.authorities.includes(auth)) {
          return true;
        }
      }
      return false;
    }
  },
  
  actions: {
    // 로그인 상태 초기화 (App.vue 호출시 인증 상태 확인)
    async initializeAuth() : Promise<boolean> {  
      try {

        let {data: apiResponse} = await api.get<ApiResponse<AuthStatusResponse>>("/auth/status");

        // 메모리 토큰은 없지만 refresh cookie가 있는 경우에만 세션을 복구합니다.
        if (!this.accessToken && apiResponse.data?.refreshTokenPresent) {
          const refreshed = await this.silentRefresh();
          if (refreshed) {
            ({data: apiResponse} = await api.get<ApiResponse<AuthStatusResponse>>("/auth/status"));
          }
        }

        // 전역 상태 업데이트
        this.id = apiResponse.data!.userId || null;
        this.authorities = apiResponse.data!.authorities || [];
        
        return true;
      } catch (error) {
        // 에러 발생 시 인증되지 않은 것으로 처리
        this.resetAuthState();
        throw error;
      }
    },
    
    async silentRefresh(): Promise<boolean> {
      try {
        const response = await api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh", {}, { skipAlert: true });
        
        if (response.data?.data?.accessToken) {
          this.setAccessToken(response.data.data.accessToken);
          return true;
        }
        return false;
      } catch {
        this.resetAuthState();
        return false;
      }
    },

    login(providerCode : ProviderInfo, options: OAuthLoginOptions = {}){
      const pendingState = options.redirectTo
        ? {
            redirectTo: options.redirectTo,
            expectedUserId: options.expectedUserId ?? null,
            grantSecurityAccess: options.grantSecurityAccess,
          }
        : null;

      if (pendingState) {
        savePendingAuthState(pendingState);
      } else {
        clearPendingAuthState();
      }

      const getOAuthUrl = (baseUrl: string) => {
        const url = new URL(baseUrl);

        if (options.action) {
          url.searchParams.set("action", options.action);
        }

        return url.toString();
      };

      switch(providerCode){
        // 오류 발생시 백엔드에서 AuthCallbackForm으로 리다이렉션하여 파라미터로 에러 코드와 메시지를 전달받아 처리
        case ProviderInfo.KAKAO:
          window.location.assign(getOAuthUrl(import.meta.env.VITE_API_OAUTH2_KAKAO));
          break;
        case ProviderInfo.NAVER:
          window.location.assign(getOAuthUrl(import.meta.env.VITE_API_OAUTH2_NAVER));
          break;
      }
    },

    setAccessToken(token: string | null) {
      this.accessToken = token;
    },

    async localLogin(dto: any): Promise<boolean> {
      try {
        // 로그인 에러는 호출한 컴포넌트에서 직접 처리 위해 skipAlert 사용
        const response = await api.post<ApiResponse<{ accessToken: string }>>("/auth/login", dto, { skipAlert: true });
        
        if (response.data?.data?.accessToken) {
          this.setAccessToken(response.data.data.accessToken);
        }
        
        await this.initializeAuth();
        return true;
      } catch (error) {
        throw error;
      }
    },

    async localSignup(dto: any): Promise<boolean> {
      try {
        // 회원가입 에러 호출한 컴포넌트에서 직접 핸들링
        await api.post<ApiResponse<void>>("/auth/signup", dto, { skipAlert: true });
        return true;
      } catch (error) {
        throw error;
      }
    },

    async logout() : Promise<boolean> {
      const success = await this.requestLogout();

      this.resetAuthState();
      return success;
    },

    async requestLogout(): Promise<boolean> {
      try {
        await api.post<ApiResponse<void>>("/auth/logout");
        return true;
      } catch {
        // 토큰이 만료되거나 하여 로그아웃 시 요구하는 인증이 실패한 경우
        return false;
      }
    },

    resetAuthState(): void {
      this.id = null;
      this.authorities = [];
      this.accessToken = null;
      clearSecurityAccess();
    },
  },
});
