import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { ListUsersQueryDTO } from "@/modules/user/models/DTO/ListUsersQueryDto";
import type { PaginatedUsersDTO, UserResponseDTO } from "@/modules/user/models/DTO/UserResponseDto";
import type { UserRole } from "@/modules/user/models/Types/UserRole";
import type { AdminDashboardDTO } from "../models/DTO/AdminDashboardDto";
import type { AdminUserOverviewDTO } from "../models/DTO/AdminUserOverviewDto";
import type { AdminSummaryDTO } from "../models/DTO/AdminSummaryDto";
import type { AdminServiceInterface } from "../models/interfaces/AdminService.interface";

export class AdminService implements AdminServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  dashboard() {
    return this.api.get<AdminDashboardDTO>("/admin/dashboard");
  }

  listAdmins() {
    return this.api.get<AdminSummaryDTO>("/admin/admins");
  }

  userOverview(id: string) {
    return this.api.get<AdminUserOverviewDTO>(`/admin/users/${id}/overview`);
  }

  listUsers(query: ListUsersQueryDTO) {
    return this.api.get<PaginatedUsersDTO>("/users", { params: cleanParams(query) });
  }

  updateRole(id: string, role: UserRole) {
    return this.api.patch<UserResponseDTO>(`/users/${id}/role`, { role });
  }
}

export const adminService = new AdminService(api);
