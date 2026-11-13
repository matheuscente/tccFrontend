import type { ApiResult } from "@/services/abstract/service.abstract";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { QuestionDTO } from "../DTO/QuestionDto";
import type { CreateQuestionDTO } from "../DTO/CreateQuestionDto";
import type { UpdateQuestionDTO } from "../DTO/UpdateQuestionDto";

export interface QuestionServiceInterface {
  listByUser(userId: string, filter?: ScopeFilterDTO): Promise<ApiResult<QuestionDTO>>
  findById(id: string): Promise<ApiResult<QuestionDTO>>
  create(data: CreateQuestionDTO): Promise<ApiResult<QuestionDTO>>
  update(id: string, data: UpdateQuestionDTO): Promise<ApiResult<QuestionDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
