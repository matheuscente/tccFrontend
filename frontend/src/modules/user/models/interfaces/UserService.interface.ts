import type { ApiResult } from "@/services/abstract/service.abstract";
import type { CreateUserDTO } from "../DTO/CreateUserDto";
import type { UpdateUserDTO } from "../DTO/UpdateUserDto";
import type { UserResponseDTO } from "../DTO/UserResponseDto";

export interface UserServiceInterface {
  create(data: CreateUserDTO): Promise<ApiResult<UserResponseDTO>>
  me(): Promise<ApiResult<UserResponseDTO>>
  update(id: string, data: UpdateUserDTO): Promise<ApiResult<UserResponseDTO>>
  updatePassword(id: string, oldPassword: string, newPassword: string): Promise<ApiResult<unknown>>
  remove(id: string): Promise<ApiResult<unknown>>
}
