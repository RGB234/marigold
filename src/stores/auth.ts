// stores/auth.js
import { defineStore } from "pinia";
import api from "@/api.js";
import router from "@/router/index.ts";

export enum EnumProviderCode {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

/*
  HttpOnly Cookie를 사용하여 인증 상태 관리
  프론트엔드 UI 업데이트를 위한 최소한의 인증 정보를 백엔드에 요청해서 저장
*/

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: false,
    authorities: [] as string[],
  }),
  
  getters: {
    // 로그인 여부 확인
    isLoggedIn: (state) => state.authenticated,
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
    // 로그인 상태 초기화 (앱 시작 시 호출)
    async initializeAuth() {  
      try {
        const response = await api.get(import.meta.env.VITE_API_AUTH_STATUS);
        console.log("AUTH STATUS response", response.data);

        // 전역 상태 업데이트
        this.authenticated = response.data.authenticated || false;
        this.authorities = response.data.authorities || [];
        
        return true;
      } catch (error) {
        console.error("❌ 인증 상태 확인 실패:", error);
        // 에러 발생 시 인증되지 않은 것으로 처리
        this.resetAuthState();
        return false;
      }
    },
    
    login(providerCode : EnumProviderCode){
      switch(providerCode){
        case EnumProviderCode.KAKAO:
          window.location.href =  import.meta.env.VITE_API_OAUTH2_LOGIN_KAKAO;
          break;
        case EnumProviderCode.NAVER:
          window.location.href = import.meta.env.VITE_API_OAUTH2_LOGIN_NAVER;
          break;
      }
    },

    signup(providerCode : EnumProviderCode){
      switch(providerCode){
        case EnumProviderCode.KAKAO:
          window.location.href =  import.meta.env.VITE_API_OAUTH2_SIGNUP_KAKAO;
          break;
        case EnumProviderCode.NAVER:
          window.location.href = import.meta.env.VITE_API_OAUTH2_SIGNUP_NAVER;
          break;
      }
    },    

    async logout() {
      await this.reoveToken();
      this.resetAuthState();
      router.push({ name: "Home" });
    },

    async reoveToken(): Promise<void> {
      try {
        const response = await api.post(import.meta.env.VITE_API_AUTH_LOGOUT);
        console.log("Logout response", response.data);
      } catch (err) {
        console.error("로그아웃 실패: ", err);
      }
    },

    resetAuthState(): void {
      this.authenticated = false;
      this.authorities = [];
    },
  },
});
