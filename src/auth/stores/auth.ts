import { defineStore } from "pinia";
import { validBASE32 } from "@/global/utils/validators";
import api from "@/global/api";
import { ApiResponse } from "@/global/types/apiResponse";
import {TSID_String} from "@/global/types/common.ts";


export enum ProviderInfo {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

/*
  HttpOnly Cookie를 사용하여 인증 상태 관리
  프론트엔드 UI 업데이트를 위한 최소한의 인증 정보를 백엔드에 요청해서 저장
*/

export const useAuthStore = defineStore("auth", {
  state: () => ({
    id: null as TSID_String | null,
    authorities: [] as string[],
  }),
  
  getters: {
    // 로그인 여부 확인
    isLoggedIn: (state) => validBASE32(state.id),
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
    // 로그인 상태 초기화 (앱 시작 시 호출)
    async initializeAuth() : Promise<boolean> {  
      try {
        const {data: apiResponse} = await api.get<ApiResponse<{ userId: string, authorities: string[] }>>("/auth/status");
        console.log("AUTH STATUS RESPONSE", apiResponse);

        // 전역 상태 업데이트
        this.id = apiResponse.data!.userId || null;
        this.authorities = apiResponse.data!.authorities || [];
        
        return true;
      } catch (error) {
        console.error("❌ 인증 상태 확인 실패:", error);
        // 에러 발생 시 인증되지 않은 것으로 처리
        this.resetAuthState();
        throw error;
      }
    },
    
    login(providerCode : ProviderInfo){
      switch(providerCode){
        // 오류 발생시 백엔드에서 콜백으로 리다이렉션하여 파라미터로 에러 코드와 메시지를 전달받아 처리
        case ProviderInfo.KAKAO:
          window.location.href =  import.meta.env.VITE_API_OAUTH2_LOGIN_KAKAO;
          break;
        case ProviderInfo.NAVER:
          window.location.href = import.meta.env.VITE_API_OAUTH2_LOGIN_NAVER;
          break;
      }
    },

    signup(providerCode : ProviderInfo){
      switch(providerCode){
        case ProviderInfo.KAKAO:
          window.location.href =  import.meta.env.VITE_API_OAUTH2_SIGNUP_KAKAO;
          break;
        case ProviderInfo.NAVER:
          window.location.href = import.meta.env.VITE_API_OAUTH2_SIGNUP_NAVER;
          break;
      }
    },    

    async logout() : Promise<boolean> {
      try{
        await this.reoveToken();
        return true;
      } catch (err) {
        console.error("서버 로그아웃 요청 실패. : ", err);
        return false;
      } finally {
        console.log("클라이언트 로그아웃 수행.");
        this.resetAuthState();
      }
    },

    async reoveToken(): Promise<boolean> {
      try {
        await api.post<ApiResponse<void>>("/auth/logout");
        return true;
      } catch (err) {
        return false;
      }
    },

    resetAuthState(): void {
      this.id = null;
      this.authorities = [];
    },
  },
});
