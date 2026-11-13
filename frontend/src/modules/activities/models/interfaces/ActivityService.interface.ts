import type { ApiResult } from "@/services/abstract/service.abstract";
import type { ActivityDetailDTO, ActivityDTO } from "../DTO/ActivityDto";
import type { ActivityForAnsweringDTO } from "../DTO/ActivityForAnsweringDto";
import type { AttemptDTO } from "../DTO/AttemptDto";
import type { CreateActivityDTO } from "../DTO/CreateActivityDto";
import type { SubmitAttemptDTO } from "../DTO/SubmitAttemptDto";
import type { UpdateActivityDTO } from "../DTO/UpdateActivityDto";

export interface ActivityServiceInterface {
  listByUser(userId: string): Promise<ApiResult<ActivityDTO>>
  findById(id: string): Promise<ApiResult<ActivityDetailDTO>>
  create(data: CreateActivityDTO): Promise<ApiResult<ActivityDetailDTO>>
  update(id: string, data: UpdateActivityDTO): Promise<ApiResult<ActivityDetailDTO>>
  setQuestions(id: string, questionIds: string[]): Promise<ApiResult<ActivityDetailDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
  forAnswering(id: string): Promise<ApiResult<ActivityForAnsweringDTO>>
  submit(id: string, data: SubmitAttemptDTO): Promise<ApiResult<AttemptDTO>>
  attempts(id: string): Promise<ApiResult<AttemptDTO>>
  attempt(attemptId: string): Promise<ApiResult<AttemptDTO>>
}
