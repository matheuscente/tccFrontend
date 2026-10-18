import { api } from "@/services/api/http";
import type { CreateGoalInput, Goal, GoalProgress, UpdateGoalInput } from "../models/goal.model";

export const goalService = {
  listByUser: (userId: string) => api.get<Goal>(`/goals/user/${userId}`),
  progress: (userId?: string) => api.get<GoalProgress>("/stats/goals", { params: userId ? { userId } : {} }),
  create: (data: CreateGoalInput) => api.post<Goal>("/goals", data),
  update: (id: string, data: UpdateGoalInput) => api.patch<Goal>(`/goals/${id}`, data),
  remove: (id: string) => api.delete(`/goals/${id}`),
};
