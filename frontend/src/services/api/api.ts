import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "./models/ApiError.interface";
import type { UseAuthStore } from "@/modules/auth/stores/models/AuthStore.interface";
import type { Login } from "@/modules/auth/models/login.dto";
import type { ApiSuccess } from "./models/ApiSuccess.interface";
import { isAuthRoute } from "./isAuthRoute.typeGuard";

declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

export const http = axios.create({ baseURL: BASE_URL, withCredentials: true });

let updating: Promise<void> | null = null;

export async function refreshSession(store: UseAuthStore): Promise<void> {
  // axios puro, sem o interceptor, para o refresh não tentar se renovar
  const { data } = await axios.post<ApiSuccess<Login>>(`${BASE_URL}/auth/refresh`, null, {
    withCredentials: true,
  });
  const session = data.data[0];

  if (!session) throw new Error("Resposta de refresh sem sessão.");

  store.setToken(session.accessToken);
  store.setExpiresAt(session.sessionExpiresAt);

}

function networkError(error: AxiosError): AxiosResponse<ApiError> {
  return {
    status: 0,
    statusText: "",
    headers: {},
    config: error.config as InternalAxiosRequestConfig,
    data: {
      statusCode: 0,
      state: "error",
      data: [{ field: "", message: "Não foi possível conectar ao servidor." }],
    },
  };
}

export function configureInterceptors(store: UseAuthStore): void {
  http.interceptors.request.use((config) => {
      if (!isAuthRoute(config.url) && store.getToken() && store.isSessionExpired()) {
    store.logout();
    return new Promise<never>(() => {});
  }
    const token = store.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      if (axios.isCancel(error)) return new Promise<never>(() => {});
      if (!error.response || !error.config) return networkError(error);

      const req = error.config;
      if (error.response.status !== 401 || req._retry || isAuthRoute(req.url)) return error.response;

      req._retry = true;

      
      updating ??= refreshSession(store).finally(() => {
        updating = null;
      });

      try {
        await updating;
        return http(req);
      } catch {
        store.logout();
        return new Promise<never>(() => {});
      }
    }
  );
}