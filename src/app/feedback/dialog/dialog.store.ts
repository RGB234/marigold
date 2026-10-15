import { defineStore } from "pinia";

interface PendingDialog {
  title: string;
  text: string;
  type: "confirm" | "alert";
  resolve: (value: boolean) => void;
}

export const useDialogStore = defineStore("dialog", {
  state: () => ({
    queue: [] as PendingDialog[],
    current: {
      show: false,
      title: "",
      text: "",
      type: "confirm" as PendingDialog["type"],
      resolve: null as ((value: boolean) => void) | null,
    },
  }),
  actions: {
    showConfirm(title: string, text: string): Promise<boolean> {
      return this.enqueue("confirm", title, text);
    },

    showAlert(title: string, text: string): Promise<boolean> {
      return this.enqueue("alert", title, text);
    },

    enqueue(type: PendingDialog["type"], title: string, text: string): Promise<boolean> {
      return new Promise((resolve) => {
        const dialog = { type, title, text, resolve };
        if (this.current.show) {
          this.queue.push(dialog);
          return;
        }
        this.current = { ...dialog, show: true };
      });
    },

    close(result: boolean): void {
      const resolve = this.current.resolve;
      const next = this.queue.shift();
      this.current = next
        ? { ...next, show: true }
        : { ...this.current, show: false, resolve: null };
      resolve?.(result);
    },
  },
});
