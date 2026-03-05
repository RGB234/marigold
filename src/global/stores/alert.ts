import { defineStore } from 'pinia';

export const useAlertStore = defineStore('alert', {
  state: () => ({
    // 모달 (Dialog)
    dialog: {
      show: false,
      title: '',
      text: '',
      type: 'confirm', // 'confirm' | 'alert'
      resolve: null as ((value: boolean) => void) | null, // Promise resolve 함수 저장용
    },
    // 토스트 (Snackbar)
    snackbar: {
      show: false,
      text: '',
      color: 'success', // success, error, warning, info
      timeout: 3000,
    },
  }),
  actions: {
    /**
     * 확인 모달 표시 (Promise 반환)
     * const result = await store.showConfirm('제목', '내용');
     * if (result) { ... }
     */
    showConfirm(title: string, text: string) {
      this.dialog = {
        show: true,
        title,
        text,
        type: 'confirm',
        resolve: null as ((value: boolean) => void) | null,
      };
      return new Promise((resolve) => {
        // Promise 성공 시 콜백함수인 resolve 함수를 전달
        this.dialog.resolve = resolve as (value: boolean) => void;
      });
    },

    /**
     * 단순 알림 모달 표시 (확인 버튼만 있음)
     * await store.showAlert('제목', '내용');
     */
    showAlert(title: string, text: string) {
        this.dialog = {
            show: true,
            title,
            text,
            type: 'alert',
            resolve: null,
        };
        return new Promise((resolve) => {
            this.dialog.resolve = resolve;
        });
    },

    /**
     * 모달 닫기 및 결과 처리
     */
    handleDialogAction(result: boolean) {
      this.dialog.show = false;
      if (this.dialog.resolve) {
        this.dialog.resolve(result);
        this.dialog.resolve = null; // resolve 해제
      }
    },

    /**
     * 토스트 메시지 표시
     */
    showToast(text: string, color = 'success', timeout = 3000) {
      this.snackbar.show = false;
      setTimeout(() => {
        this.snackbar = {
          show: true,
          text,
          color,
          timeout,
        };
      }, 50);
    },
  },
});
