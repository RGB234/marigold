import { useAlertStore } from '@/global/stores/alert';

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

  return {
    confirm,
    alert,
    toast,
  };
}
