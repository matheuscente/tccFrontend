import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

export interface CreateActivityDTO extends Scope {
  title: string
  description?: string | null
  questionIds?: string[]
}
