import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

export interface CreateNoteDTO extends Scope {
  title: string
  content?: string
}
