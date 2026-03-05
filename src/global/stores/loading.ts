import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false,
    requestCount: 0, // 여러 요청이 동시에 발생할 때를 대비한 카운터
  }),
  actions: {
    start() {
      this.requestCount++;
      this.isLoading = true;
    },
    stop() {
      if (this.requestCount > 0) {
        this.requestCount--;
      }
      // 모든 요청이 끝나면 로딩 종료
      if (this.requestCount === 0) {
        this.isLoading = false;
      }
    },
    // 강제 종료 (에러 발생 시 등)
    reset() {
      this.requestCount = 0;
      this.isLoading = false;
    }
  }
});
