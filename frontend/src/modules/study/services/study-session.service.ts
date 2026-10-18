import { api } from "@/services/api/http";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { ManualSessionInput, StudySession } from "../models/study-session.model";

export const studySessionService = {
  listByUser: (userId: string) => api.get<StudySession>(`/study-sessions/user/${userId}`),
  active: () => api.get<StudySession>("/study-sessions/active"),
  start: (scope: Scope) => api.post<StudySession>("/study-sessions", scope),
  finish: (id: string) => api.patch<StudySession>(`/study-sessions/${id}/finish`),
  register: (data: ManualSessionInput) => api.post<StudySession>("/study-sessions/manual", data),
  update: (id: string, data: { minutes?: number, studiedAt?: string }) => api.patch<StudySession>(`/study-sessions/${id}`, data),
  remove: (id: string) => api.delete(`/study-sessions/${id}`),
};
