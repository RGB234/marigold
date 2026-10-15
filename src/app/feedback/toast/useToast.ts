import { useToastStore, type ToastColor } from "@/app/feedback/toast/toast.store";

export function useToast() {
  const store = useToastStore();

  return {
    success: (text: string) => store.open(text, "success"),
    error: (text: string) => store.open(text, "error"),
    warning: (text: string) => store.open(text, "warning"),
    info: (text: string) => store.open(text, "info"),
    show: (text: string, color: ToastColor) => store.open(text, color),
  };
}
