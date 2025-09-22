import { ref } from "vue";
import api from "@/api";

export function useAuth() {
  const isAuthenticated = ref(false);

  async function checkAuth() {
    try {
      const response = await api.get(process.env.VUE_APP_API_AUTH_CHECK_LOGIN);
      isAuthenticated.value = response.data?.authenticated ? true : false;

      console.log(response);
    } catch (err) {
      alert("로그인 확인 실패");
      console.error("로그인 확인 실패", err);
      isAuthenticated.value = false;
    }
  }

  async function logout() {
    try {
      const response = await api.post(process.env.VUE_APP_API_AUTH_LOGOUT);
      isAuthenticated.value = response.data.isAuthenticated;
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  }

  return { isAuthenticated, checkAuth, logout };
}
