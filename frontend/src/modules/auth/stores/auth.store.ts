import { defineStore } from "pinia";
import { Service } from "@/services/abstract/service.abstract";
import { http, refreshSession } from "@/services/api/api";
import type { Login } from "../models/login.dto";
import type { ApiError } from "@/services/api/models/ApiError.interface";
import { isError } from "@/services/api/isError.typeGuard";
import { router } from "@/router";
import { routeProps } from "@/router/RouteProps";

const service = new Service(http);
const url = "/auth";

let loggingOut = false;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null as string | null,
    isAuthenticated: false,
    expiresAt: null as number | null,
  }),

  actions: {
    async login(username: string, password: string): Promise<ApiError | void> {
      const response = await service.post<Login>(`${url}/login`, { username, password });

      if (isError(response)) return response;

      const session = response.data[0];
      if (!session) return;

      this.setToken(session.accessToken);
      this.setExpiresAt(session.sessionExpiresAt);
      this.setIsAuth(true);
    },

    async logout(): Promise<void> {
      if (loggingOut) return;
      loggingOut = true;

      try {
        await service.post(`${url}/logout`);
      } finally {
        this.clearSession();
        loggingOut = false;
        router.push({ name: routeProps.login.name});
      }
    },

    async restoreSession(): Promise<void> {
      try {
        await refreshSession(this);
        this.setIsAuth(true);
      } catch {
        this.clearSession();
      }
    },

    clearSession() {
      this.setToken(null);
      this.setExpiresAt(null);
      this.setIsAuth(false);
    },

    isSessionExpired(): boolean {
      if (!this.expiresAt) return true;
      return Date.now() >= this.expiresAt;
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