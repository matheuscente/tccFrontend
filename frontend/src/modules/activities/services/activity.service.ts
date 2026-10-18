import { api } from "@/services/api/http";
import type { Activity, ActivityDetail, ActivityForAnswering, Attempt, CreateActivityInput, SubmitAttemptInput } from "../models/activity.model";

export const activityService = {
  listByUser: (userId: string) => api.get<Activity>(`/activities/user/${userId}`),
  findById: (id: string) => api.get<ActivityDetail>(`/activities/id/${id}`),
  create: (data: CreateActivityInput) => api.post<ActivityDetail>("/activities", data),
  update: (id: string, data: { title?: string, description?: string | null }) => api.patch<ActivityDetail>(`/activities/${id}`, data),
  setQuestions: (id: string, questionIds: string[]) => api.put<ActivityDetail>(`/activities/${id}/questions`, { questionIds }),
  remove: (id: string) => api.delete(`/activities/${id}`),
  forAnswering: (id: string) => api.get<ActivityForAnswering>(`/activities/${id}/answer`),
  submit: (id: string, data: SubmitAttemptInput) => api.post<Attempt>(`/activities/${id}/attempts`, data),
  attempts: (id: string) => api.get<Attempt>(`/activities/${id}/attempts`),
  attempt: (attemptId: string) => api.get<Attempt>(`/activities/attempts/${attemptId}`),
};
