import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { ActivityDetailDTO, ActivityDTO } from "../models/DTO/ActivityDto";
import type { ActivityForAnsweringDTO } from "../models/DTO/ActivityForAnsweringDto";
import type { AttemptDTO } from "../models/DTO/AttemptDto";
import type { CreateActivityDTO } from "../models/DTO/CreateActivityDto";
import type { SubmitAttemptDTO } from "../models/DTO/SubmitAttemptDto";
import type { UpdateActivityDTO } from "../models/DTO/UpdateActivityDto";
import type { ActivityServiceInterface } from "../models/interfaces/ActivityService.interface";

export class ActivityService implements ActivityServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<ActivityDTO>(`/activities/user/${userId}`);
  }

  findById(id: string) {
    return this.api.get<ActivityDetailDTO>(`/activities/id/${id}`);
  }

  create(data: CreateActivityDTO) {
    return this.api.post<ActivityDetailDTO>("/activities", data);
  }

  update(id: string, data: UpdateActivityDTO) {
    return this.api.patch<ActivityDetailDTO>(`/activities/${id}`, data);
  }

  setQuestions(id: string, questionIds: string[]) {
    return this.api.put<ActivityDetailDTO>(`/activities/${id}/questions`, { questionIds });
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/activities/${id}`);
  }

  forAnswering(id: string) {
    return this.api.get<ActivityForAnsweringDTO>(`/activities/${id}/answer`);
  }

  submit(id: string, data: SubmitAttemptDTO) {
    return this.api.post<AttemptDTO>(`/activities/${id}/attempts`, data);
  }

  attempts(id: string) {
    return this.api.get<AttemptDTO>(`/activities/${id}/attempts`);
  }

  attempt(attemptId: string) {
    return this.api.get<AttemptDTO>(`/activities/attempts/${attemptId}`);
  }
}

export const activityService = new ActivityService(api);
