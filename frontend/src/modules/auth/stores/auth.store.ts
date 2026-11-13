import { defineStore } from "pinia";
import { refreshSession } from "@/services/api/api";
import type { ApiError } from "@/services/api/models/ApiError.interface";
import { isError } from "@/services/api/isError.typeGuard";
import { router } from "@/router";
import { routeProps } from "@/router/RouteProps";
import type { UserResponseDTO } from "@/modules/user/models/DTO/UserResponseDto";
import { userService } from "@/modules/user/services/user.service";
import { authService } from "../services/auth.service";

let loggingOut = false;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null as string | null,
    isAuthenticated: false,
    expiresAt: null as number | null,
    user: null as UserResponseDTO | null,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === "ADMIN",
    userId: (state) => state.user?.id ?? "",
  },

  actions: {
    async login(username: string, password: string): Promise<ApiError | void> {
      const response = await authService.login({ username, password });

      if (isError(response)) return response;

      const session = response.data[0];
      if (!session) return;

      this.setToken(session.accessToken);
      this.setExpiresAt(session.sessionExpiresAt);
      this.setIsAuth(true);

      await this.loadUser();
    },

    async loadUser(): Promise<void> {
      const response = await userService.me();
      if (!isError(response)) this.user = response.data[0] ?? null;
    },

    async logout(): Promise<void> {
      if (loggingOut) return;
      loggingOut = true;

      try {
        if (this.token) await authService.logout();
      } finally {
        this.clearSession();
        loggingOut = false;
        await router.push({ name: routeProps.login.name });
      }
    },

    async restoreSession(): Promise<void> {
      try {
        await refreshSession(this);
        this.setIsAuth(true);
        await this.loadUser();
      } catch {
        this.clearSession();
      }
    },

    clearSession() {
      this.setToken(null);
      this.setExpiresAt(null);
      this.setIsAuth(false);
      this.user = null;
    },

    isSessionExpired(): boolean {
      if (!this.expiresAt) return true;
      // a API envia a expiração em segundos (epoch Unix)
      return Date.now() >= this.expiresAt * 1000;
    },

    setToken(token: string | null) {
      this.token = token;
    },

    getToken() {
      return this.token;
    },

    setExpiresAt(expiresAt: number | null) {
      this.expiresAt = expiresAt;
    },

    getExpiresAt() {
      return this.expiresAt;
    },

    setIsAuth(isAuth: boolean) {
      this.isAuthenticated = isAuth;
    },

    getIsAuth() {
      return this.isAuthenticated;
    },
  },
});
