import type { ApiResult } from "@/services/abstract/service.abstract";
import type { CourseDTO } from "../DTO/CourseDto";
import type { TitledInputDTO } from "../DTO/TitledInputDto";

export interface CourseServiceInterface {
  listByUser(userId: string): Promise<ApiResult<CourseDTO>>
  findById(id: string): Promise<ApiResult<CourseDTO>>
  create(userId: string, data: TitledInputDTO): Promise<ApiResult<CourseDTO>>
  update(id: string, data: Partial<TitledInputDTO>): Promise<ApiResult<CourseDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
