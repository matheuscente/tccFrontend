import type { ApiResult } from "@/services/abstract/service.abstract";
import type { LoginDTO, LoginResponseDTO } from "../DTO/LoginDto";
import type { MessageResponseDTO } from "../DTO/MessageResponseDto";

export interface AuthServiceInterface {
  login(data: LoginDTO): Promise<ApiResult<LoginResponseDTO>>
  logout(): Promise<ApiResult<unknown>>
  forgotPassword(email: string): Promise<ApiResult<MessageResponseDTO>>
  resetPassword(token: string, newPassword: string): Promise<ApiResult<MessageResponseDTO>>
}
