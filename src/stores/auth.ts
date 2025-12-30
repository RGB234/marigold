// stores/auth.js
import { defineStore } from "pinia";
import api from "@/api.js";
import { jwtDecode, type JwtPayload } from "jwt-decode";

export enum EnumProviderCode {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}
export const useAuthStore = defineStore("auth", {
  state: () => ({
    isAuthenticated: false,
    authorities: [] as string[],
  }),
  
  getters: {
    // 로그인 여부 확인
    isLoggedIn: (state) => state.isAuthenticated,
    // 권한 목록
    userAuthorities: (state) => state.authorities,
    // 특정 권한 보유 여부 확인
    hasAuthority: (state) => (authority: string) => 
      state.authorities.includes(authority),
  },
  
  actions: {
    // JWT 토큰 유효성 검사
    checkTokenValid(): boolean {
      const accessToken = this.getAccessToken();
      if (!accessToken) return false;
    
      try {
        // 1. 타입 캐스팅을 통해 exp 속성 보장
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        
        if (!decodedToken.exp) return false;
    
        // 2. 현재 시간에 10초~30초 정도의 버퍼를 더함 (Network Latency 및 Clock Skew 방지)
        const buffer = 10; 
        const currentTime = Math.floor(Date.now() / 1000);
        
        // 만료 시간보다 (현재 시간 + 버퍼)가 작아야 유효한 것으로 판단
        return decodedToken.exp > (currentTime + buffer);
        
      } catch (error) {
        // 토큰이 손상되었거나 형식이 잘못된 경우
        console.error("Invalid token format:", error);
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
      try {
        const response = await api.post(import.meta.env.VITE_API_AUTH_LOGOUT);
        this.isAuthenticated = false;
        this.authorities = [];

        console.info(response.data);
      } catch (err) {
        alert("로그아웃 실패");
        console.error("로그아웃 실패: ", err);
      } finally {
        this.removeToken();
      }
    },

    saveAccessToken(token:string) : void{
      localStorage.setItem("accessToken", token);
    },

    saveRefreshToken(token:string) : void{
      localStorage.setItem("refreshToken", token);
    },

    getAccessToken() : string | null{
      return localStorage.getItem("accessToken");
    },

    getRefreshToken() : string | null{
      return localStorage.getItem("refreshToken");
    },

    removeToken(): void {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});
