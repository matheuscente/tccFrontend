import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";

export const useLeaveGuard = (hasPendingChanges: () => boolean, message: string) => {
  const auth = useAuthStore();
  const confirm = useConfirmStore();

  onBeforeRouteLeave(async () => {
    // sessão encerrada (logout/expiração): não segura a navegação para o login
    if (!auth.getToken() || !hasPendingChanges()) return true;
    return confirm.ask({ title: "Sair da página", message, confirmText: "Sair" });
  });
};
