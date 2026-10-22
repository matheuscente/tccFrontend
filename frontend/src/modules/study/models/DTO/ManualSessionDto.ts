import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

export interface ManualSessionDTO extends Scope {
  minutes: number
  studiedAt: string
}
