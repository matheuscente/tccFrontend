import type { ApiResult } from "@/services/abstract/service.abstract";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ManualSessionDTO } from "../DTO/ManualSessionDto";
import type { StudySessionDTO } from "../DTO/StudySessionDto";
import type { UpdateStudySessionDTO } from "../DTO/UpdateStudySessionDto";

export interface StudySessionServiceInterface {
  listByUser(userId: string): Promise<ApiResult<StudySessionDTO>>
  active(): Promise<ApiResult<StudySessionDTO>>
  start(scope: Scope): Promise<ApiResult<StudySessionDTO>>
  finish(id: string): Promise<ApiResult<StudySessionDTO>>
  register(data: ManualSessionDTO): Promise<ApiResult<StudySessionDTO>>
  update(id: string, data: UpdateStudySessionDTO): Promise<ApiResult<StudySessionDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
