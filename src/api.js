import axios from "axios";

// 환경변수로 API 기본 URL 설정
const apiBase = process.env.VUE_APP_API_BASE;

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: apiBase,
  withCredentials: true, // 쿠키/세션 포함
  headers: {
    "Content-Type": "application/json",
  },
});

// 응답 Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response);
    if (error.response?.status === 401) {
      // UNAUTHORIZED
      alert("UNAUTHORIZED");
      window.location.href = process.env.VUE_APP_HOME;
    }
    return Promise.reject(error);
  }
);

export default api;
