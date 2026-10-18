import { defineStore } from "pinia";

type NotifyColor = "success" | "error" | "info" | "warning";

/** Snackbar global para mensagens de sucesso/erro. */
export const useNotifyStore = defineStore("notify", {
  state: () => ({
    visible: false,
    message: "",
    color: "success" as NotifyColor,
  }),
  actions: {
    show(message: string, color: NotifyColor = "success") {
      this.message = message;
      this.color = color;
      this.visible = false;
      // reabre mesmo se já estiver visível
      queueMicrotask(() => { this.visible = true; });
    },
    success(message: string) { this.show(message, "success"); },
    error(message: string) { this.show(message, "error"); },
    info(message: string) { this.show(message, "info"); },
  },
});
