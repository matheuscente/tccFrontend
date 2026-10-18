import type { ApiError } from "@/services/api/models/ApiError.interface";
import type { ApiSuccess } from "@/services/api/models/ApiSuccess.interface";
import type { AxiosInstance } from "axios";


export class Service {
    private http: AxiosInstance
  constructor(http: AxiosInstance) {
    this.http = http
  }

  async get<T>(url: string): Promise<ApiSuccess<T> | ApiError> {
    const { data } = await this.http.get<ApiSuccess<T> | ApiError>(url);
    return data;
  }
  async post<T>(url: string, body?: unknown): Promise<ApiSuccess<T> | ApiError> {
    const { data } = await this.http.post<ApiSuccess<T> | ApiError>(url, body);
    return data;
  }
  async put<T>(url: string, body?: unknown): Promise<ApiSuccess<T> | ApiError> {
    const { data } = await this.http.put<ApiSuccess<T> | ApiError>(url, body);
    return data;
  }
  async delete<T>(url: string): Promise<ApiSuccess<T> | ApiError> {
    const { data } = await this.http.delete<ApiSuccess<T> | ApiError>(url);
    return data;
  }
};