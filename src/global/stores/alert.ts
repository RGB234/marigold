import { defineStore } from 'pinia';

interface PendingDialog {
  title: string;
  text: string;
  type: 'confirm' | 'alert';
  resolve: (value: boolean) => void;
}

export const useAlertStore = defineStore('alert', {
  state: () => ({
    queue: [] as PendingDialog[],
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
      return this.enqueueDialog('confirm', title, text);
    },

    /**
     * 단순 알림 모달 표시 (확인 버튼만 있음)
     * await store.showAlert('제목', '내용');
     */
    showAlert(title: string, text: string) {
      return this.enqueueDialog('alert', title, text);
    },

    enqueueDialog(type: PendingDialog['type'], title: string, text: string): Promise<boolean> {
      return new Promise((resolve) => {
        const dialog = { type, title, text, resolve };
        if (this.dialog.show) {
          this.queue.push(dialog);
        } else {
          this.dialog = { ...dialog, show: true };
        }
      });
    },

    /**
     * 모달 닫기 및 결과 처리
     */
    handleDialogAction(result: boolean) {
      const resolve = this.dialog.resolve;
      const next = this.queue.shift();
      this.dialog = next
        ? { ...next, show: true }
        : { ...this.dialog, show: false, resolve: null };
      resolve?.(result);
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
