import { useDialogStore } from "@/app/feedback/dialog/dialog.store";

export function useDialog() {
  const store = useDialogStore();

  return {
    confirm: (title: string, text: string) => store.showConfirm(title, text),
    alert: (title: string, text: string) => store.showAlert(title, text),
  };
}
