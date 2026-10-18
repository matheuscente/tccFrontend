import { api } from "@/services/api/http";
import { cleanParams } from "@/utils/params";
import type { ListFilter } from "@/modules/questions/models/question.model";
import type { Note, NoteInput } from "../models/note.model";

export const noteService = {
  listByUser: (userId: string, filter: ListFilter = {}) => api.get<Note>(`/notes/user/${userId}`, { params: cleanParams(filter) }),
  findById: (id: string) => api.get<Note>(`/notes/id/${id}`),
  create: (data: NoteInput) => api.post<Note>("/notes", data),
  update: (id: string, data: Partial<NoteInput>) => api.patch<Note>(`/notes/${id}`, data),
  remove: (id: string) => api.delete(`/notes/${id}`),
};
