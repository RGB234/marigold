import axios from "axios";

// 환경변수로 API 기본 URL 설정
const apiBase = import.meta.env.VITE_APP_API_BASE;

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
    if (error.response?.status === 400) {
      // BAD REQUEST
      alert("BAD REQUEST");
      console.error(error.response);
    }
    if (error.response?.status === 401) {
      // UNAUTHORIZED
      alert("UNAUTHORIZED");
      console.error(error.response);
      // window.location.href = import.meta.env.VITE_APP_HOME;
    }
    if (error.response?.status === 404) {
      // NOT FOUND
      alert("NOT FOUND");
      console.error(error.response);
      // window.location.href = import.meta.env.VITE_APP_HOME;
    }
    return Promise.reject(error);
  }
);

export default api;
