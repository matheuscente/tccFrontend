import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

export interface UpdateFileDTO extends Scope {
  originalName?: string
}
