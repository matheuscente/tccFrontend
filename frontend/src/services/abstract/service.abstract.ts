import type { ApiError } from "@/services/api/models/ApiError.interface";
import type { ApiSuccess } from "@/services/api/models/ApiSuccess.interface";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// Erros HTTP não lançam exceção: o interceptor devolve a resposta e aqui ela vira um ApiError.
export class Service {
  private http: AxiosInstance;

  constructor(http: AxiosInstance) {
    this.http = http;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return this.normalize<T>(await this.http.get(url, config));
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return this.normalize<T>(await this.http.post(url, body, config));
  }

  async put<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
    return this.normalize<T>(await this.http.put(url, body));
  }

  async patch<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
    return this.normalize<T>(await this.http.patch(url, body));
  }

  async delete<T>(url: string): Promise<ApiResult<T>> {
    return this.normalize<T>(await this.http.delete(url));
  }

  private normalize<T>(response: AxiosResponse): ApiResult<T> {
    const body = response.data;

    if (response.status < 400 && (body === "" || body === undefined || body === null)) {
      return { statusCode: response.status, state: "success", data: [] };
    }

    if (body && typeof body === "object" && "state" in body) return body as ApiResult<T>;

    if (response.status >= 400) {
      return {
        statusCode: response.status,
        state: "error",
        data: [{ field: "", message: "Ocorreu um erro inesperado. Tente novamente." }],
      };
    }

    return { statusCode: response.status, state: "success", data: (Array.isArray(body) ? body : [body]) as T[] };
  }
}
