import { api } from "@/services/api/http";
import { cleanParams } from "@/utils/params";
import type { PaginatedUsersDTO, UserResponseDTO } from "@/modules/user/models/DTO/UserResponseDto";
import type { AdminDashboard, AdminUserOverview } from "../models/admin.model";

export const adminService = {
  dashboard: () => api.get<AdminDashboard>("/admin/dashboard"),
  userOverview: (id: string) => api.get<AdminUserOverview>(`/admin/users/${id}/overview`),
  listUsers: (query: { search?: string, page?: number, pageSize?: number }) => api.get<PaginatedUsersDTO>("/users", { params: cleanParams(query) }),
  updateRole: (id: string, role: "ADMIN" | "USER") => api.patch<UserResponseDTO>(`/users/${id}/role`, { role }),
};
