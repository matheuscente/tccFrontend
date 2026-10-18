import { api } from "@/services/api/http";
import type { CreateUserDTO } from "../models/DTO/CreateUserDto";
import type { UpdateUserDTO } from "../models/DTO/UpdateUserDto";
import type { UserResponseDTO } from "../models/DTO/UserResponseDto";

export const userService = {
  create: (data: CreateUserDTO) => api.post<UserResponseDTO>("/users", data),
  me: () => api.get<UserResponseDTO>("/users/me"),
  update: (id: string, data: UpdateUserDTO) => api.patch<UserResponseDTO>(`/users/${id}`, data),
  updatePassword: (id: string, oldPassword: string, newPassword: string) => api.patch(`/users/${id}/password`, { oldPassword, newPassword }),
  remove: (id: string) => api.delete(`/users/${id}`),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) => api.post<{ message: string }>("/auth/reset-password", { token, newPassword }),
};
