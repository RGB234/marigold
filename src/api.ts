import axios, { AxiosInstance } from "axios";

// 환경변수로 API 기본 URL 설정
const apiBase = import.meta.env.VITE_APP_API_BASE;

// Axios 인스턴스 생성
const api : AxiosInstance = axios.create({
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
      alert("BAD REQUEST");
    }
    if (error.response?.status === 401) {
      alert("UNAUTHORIZED");
    }
    if (error.response?.status === 404) {
      alert("NOT FOUND");
    }
    return Promise.reject(error);
  }
);

export default api;
