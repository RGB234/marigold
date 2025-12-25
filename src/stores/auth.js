// stores/auth.js
import { defineStore } from "pinia";
import api from "@/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isAuthenticated: false,
    authorities: [],
  }),
  actions: {
    async login(){
      try {
        const response = await api.post(process.env.VUE_APP_API_AUTH_LOGIN);
        this.isAuthenticated = true;
        this.authorities.push(...response.data.authorities);
        console.info(response.data);
      } catch (err) {
        alert("로그인 실패");
        console.error("로그인 실패: ", err);
      }
    },

    async logout() {
      try {
        const response = await api.post(process.env.VUE_APP_API_AUTH_LOGOUT);
        this.isAuthenticated = false;
        this.authorities = [];

        console.info(response.data);
      } catch (err) {
        alert("로그아웃 실패");
        console.error("로그아웃 실패: ", err);
      }
    },

    async getAuthStatus() {
      try {
        const response = await api.get(process.env.VUE_APP_API_AUTH_STATUS);
        const authState = response.data;
        this.isAuthenticated = authState.authenticated;
        this.authorities.push(...authState.authorities);
      } catch (err) {
        alert("로그인 확인 실패");
        console.error("로그인 확인 실패", err);

        this.isAuthenticated = false;
        this.authorities = [];
      }
    },
  },
});
