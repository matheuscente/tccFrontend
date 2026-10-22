import type { ApiResult } from "@/services/abstract/service.abstract";
import type { CreateGoalDTO } from "../DTO/CreateGoalDto";
import type { GoalDTO } from "../DTO/GoalDto";
import type { GoalProgressDTO } from "../DTO/GoalProgressDto";
import type { UpdateGoalDTO } from "../DTO/UpdateGoalDto";

export interface GoalServiceInterface {
  listByUser(userId: string): Promise<ApiResult<GoalDTO>>
  progress(userId?: string): Promise<ApiResult<GoalProgressDTO>>
  create(data: CreateGoalDTO): Promise<ApiResult<GoalDTO>>
  update(id: string, data: UpdateGoalDTO): Promise<ApiResult<GoalDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
