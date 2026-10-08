import { useAlertStore } from '@/global/stores/alert';
import { getApiErrorMessage } from '@/global/utils/apiError';

export function useAlert() {
  const store = useAlertStore();

  const confirm = (title: string, text: string) => store.showConfirm(title, text);
  const alert = (title: string, text: string) => store.showAlert(title, text);
  
  // Toast variants
  const toast = {
    success: (text: string) => store.showToast(text, 'success'),
    error: (text: string) => store.showToast(text, 'error'),
    warning: (text: string) => store.showToast(text, 'warning'),
    info: (text: string) => store.showToast(text, 'info'),
    show: (text: string, color: string) => store.showToast(text, color),
  };

  const apiError = (error: unknown, fallback?: string) => {
    const message = getApiErrorMessage(error, fallback);
    if (message) toast.error(message);
  };

  return {
    confirm,
    alert,
    toast,
    apiError,
  };
}
