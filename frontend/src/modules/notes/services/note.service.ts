import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { CreateNoteDTO } from "../models/DTO/CreateNoteDto";
import type { NoteDTO } from "../models/DTO/NoteDto";
import type { UpdateNoteDTO } from "../models/DTO/UpdateNoteDto";
import type { NoteServiceInterface } from "../models/interfaces/NoteService.interface";

export class NoteService implements NoteServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string, filter: ScopeFilterDTO = {}) {
    return this.api.get<NoteDTO>(`/notes/user/${userId}`, { params: cleanParams(filter) });
  }

  findById(id: string) {
    return this.api.get<NoteDTO>(`/notes/id/${id}`);
  }

  create(data: CreateNoteDTO) {
    return this.api.post<NoteDTO>("/notes", data);
  }

  update(id: string, data: UpdateNoteDTO) {
    return this.api.patch<NoteDTO>(`/notes/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/notes/${id}`);
  }
}

export const noteService = new NoteService(api);
