import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { CreateGoalDTO } from "../models/DTO/CreateGoalDto";
import type { GoalDTO } from "../models/DTO/GoalDto";
import type { GoalProgressDTO } from "../models/DTO/GoalProgressDto";
import type { UpdateGoalDTO } from "../models/DTO/UpdateGoalDto";
import type { GoalServiceInterface } from "../models/interfaces/GoalService.interface";

export class GoalService implements GoalServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<GoalDTO>(`/goals/user/${userId}`);
  }

  progress(userId?: string) {
    return this.api.get<GoalProgressDTO>("/stats/goals", { params: userId ? { userId } : {} });
  }

  create(data: CreateGoalDTO) {
    return this.api.post<GoalDTO>("/goals", data);
  }

  update(id: string, data: UpdateGoalDTO) {
    return this.api.patch<GoalDTO>(`/goals/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/goals/${id}`);
  }
}

export const goalService = new GoalService(api);
