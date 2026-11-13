import type { ApiResult } from "@/services/abstract/service.abstract";
import type { DisciplineDTO } from "../DTO/DisciplineDto";
import type { TitledInputDTO } from "../DTO/TitledInputDto";

export interface DisciplineServiceInterface {
  listByUser(userId: string): Promise<ApiResult<DisciplineDTO>>
  listByModule(moduleId: string): Promise<ApiResult<DisciplineDTO>>
  findById(id: string): Promise<ApiResult<DisciplineDTO>>
  create(moduleId: string, data: TitledInputDTO): Promise<ApiResult<DisciplineDTO>>
  update(id: string, data: Partial<TitledInputDTO>): Promise<ApiResult<DisciplineDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
