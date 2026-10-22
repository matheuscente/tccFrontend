import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { CreateUserDTO } from "../models/DTO/CreateUserDto";
import type { UpdatePasswordDTO } from "../models/DTO/UpdatePasswordDto";
import type { UpdateUserDTO } from "../models/DTO/UpdateUserDto";
import type { UserResponseDTO } from "../models/DTO/UserResponseDto";
import type { UserServiceInterface } from "../models/interfaces/UserService.interface";

const url = "/users";

export class UserService implements UserServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  create(data: CreateUserDTO) {
    return this.api.post<UserResponseDTO>(url, data);
  }

  me() {
    return this.api.get<UserResponseDTO>(`${url}/me`);
  }

  update(id: string, data: UpdateUserDTO) {
    return this.api.patch<UserResponseDTO>(`${url}/${id}`, data);
  }

  updatePassword(id: string, oldPassword: string, newPassword: string) {
    const body: UpdatePasswordDTO = { oldPassword, newPassword };
    return this.api.patch<unknown>(`${url}/${id}/password`, body);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`${url}/${id}`);
  }
}

export const userService = new UserService(api);
