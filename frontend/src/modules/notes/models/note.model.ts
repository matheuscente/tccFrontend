import type { Scope } from "@/modules/courses/models/structure.model";

export interface Note {
  id: string
  title: string
  content: string
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  createdAt: string
  updatedAt: string
}

export interface NoteInput extends Scope {
  title: string
  content?: string
}
