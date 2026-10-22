import type { ApiResult } from "@/services/abstract/service.abstract";
import type { ListUsersQueryDTO } from "@/modules/user/models/DTO/ListUsersQueryDto";
import type { PaginatedUsersDTO, UserResponseDTO } from "@/modules/user/models/DTO/UserResponseDto";
import type { UserRole } from "@/modules/user/models/Types/UserRole";
import type { AdminDashboardDTO } from "../DTO/AdminDashboardDto";
import type { AdminUserOverviewDTO } from "../DTO/AdminUserOverviewDto";

export interface AdminServiceInterface {
  dashboard(): Promise<ApiResult<AdminDashboardDTO>>
  userOverview(id: string): Promise<ApiResult<AdminUserOverviewDTO>>
  listUsers(query: ListUsersQueryDTO): Promise<ApiResult<PaginatedUsersDTO>>
  updateRole(id: string, role: UserRole): Promise<ApiResult<UserResponseDTO>>
}
