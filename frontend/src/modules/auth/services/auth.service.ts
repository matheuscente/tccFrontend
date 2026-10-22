import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { LoginDTO, LoginResponseDTO } from "../models/DTO/LoginDto";
import type { MessageResponseDTO } from "../models/DTO/MessageResponseDto";
import type { AuthServiceInterface } from "../models/interfaces/AuthService.interface";

const url = "/auth";

export class AuthService implements AuthServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  login(data: LoginDTO) {
    return this.api.post<LoginResponseDTO>(`${url}/login`, data);
  }

  logout() {
    return this.api.delete<unknown>(`${url}/logout`);
  }

  forgotPassword(email: string) {
    return this.api.post<MessageResponseDTO>(`${url}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.api.post<MessageResponseDTO>(`${url}/reset-password`, { token, newPassword });
  }
}

export const authService = new AuthService(api);
