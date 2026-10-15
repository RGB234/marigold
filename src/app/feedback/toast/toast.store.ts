import { defineStore } from "pinia";

export type ToastColor = "success" | "error" | "warning" | "info";

export const useToastStore = defineStore("toast", {
  state: () => ({
    show: false,
    text: "",
    color: "success" as ToastColor,
    timeout: 3000,
  }),
  actions: {
    open(text: string, color: ToastColor = "success", timeout = 3000): void {
      this.show = false;
      setTimeout(() => {
        this.text = text;
        this.color = color;
        this.timeout = timeout;
        this.show = true;
      }, 50);
    },
  },
});
