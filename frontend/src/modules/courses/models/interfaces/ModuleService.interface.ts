import type { ApiResult } from "@/services/abstract/service.abstract";
import type { ModuleDTO } from "../DTO/ModuleDto";
import type { TitledInputDTO } from "../DTO/TitledInputDto";

export interface ModuleServiceInterface {
  listByUser(userId: string): Promise<ApiResult<ModuleDTO>>
  listByCourse(courseId: string): Promise<ApiResult<ModuleDTO>>
  findById(id: string): Promise<ApiResult<ModuleDTO>>
  create(courseId: string, data: TitledInputDTO): Promise<ApiResult<ModuleDTO>>
  update(id: string, data: Partial<TitledInputDTO>): Promise<ApiResult<ModuleDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
