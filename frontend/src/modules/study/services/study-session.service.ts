import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ManualSessionDTO } from "../models/DTO/ManualSessionDto";
import type { StudySessionDTO } from "../models/DTO/StudySessionDto";
import type { UpdateStudySessionDTO } from "../models/DTO/UpdateStudySessionDto";
import type { StudySessionServiceInterface } from "../models/interfaces/StudySessionService.interface";

export class StudySessionService implements StudySessionServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<StudySessionDTO>(`/study-sessions/user/${userId}`);
  }

  active() {
    return this.api.get<StudySessionDTO>("/study-sessions/active");
  }

  start(scope: Scope) {
    return this.api.post<StudySessionDTO>("/study-sessions", scope);
  }

  finish(id: string) {
    return this.api.patch<StudySessionDTO>(`/study-sessions/${id}/finish`);
  }

  register(data: ManualSessionDTO) {
    return this.api.post<StudySessionDTO>("/study-sessions/manual", data);
  }

  update(id: string, data: UpdateStudySessionDTO) {
    return this.api.patch<StudySessionDTO>(`/study-sessions/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/study-sessions/${id}`);
  }
}

export const studySessionService = new StudySessionService(api);
