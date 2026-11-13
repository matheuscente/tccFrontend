import type { ApiResult } from "@/services/abstract/service.abstract";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { CreateNoteDTO } from "../DTO/CreateNoteDto";
import type { NoteDTO } from "../DTO/NoteDto";
import type { UpdateNoteDTO } from "../DTO/UpdateNoteDto";

export interface NoteServiceInterface {
  listByUser(userId: string, filter?: ScopeFilterDTO): Promise<ApiResult<NoteDTO>>
  findById(id: string): Promise<ApiResult<NoteDTO>>
  create(data: CreateNoteDTO): Promise<ApiResult<NoteDTO>>
  update(id: string, data: UpdateNoteDTO): Promise<ApiResult<NoteDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
