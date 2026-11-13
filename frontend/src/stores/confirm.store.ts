import { defineStore } from "pinia";

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  color?: string
}

export const useConfirmStore = defineStore("confirm", {
  state: () => ({
    visible: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    color: "error",
    resolver: null as ((value: boolean) => void) | null,
  }),
  actions: {
    ask(options: ConfirmOptions): Promise<boolean> {
      this.resolver?.(false);
      this.title = options.title;
      this.message = options.message;
      this.confirmText = options.confirmText ?? "Confirmar";
      this.color = options.color ?? "error";
      this.visible = true;
      return new Promise((resolve) => { this.resolver = resolve; });
    },
    answer(value: boolean) {
      this.visible = false;
      this.resolver?.(value);
      this.resolver = null;
    },
  },
});
