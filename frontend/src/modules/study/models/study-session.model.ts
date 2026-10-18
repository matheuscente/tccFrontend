import type { Scope } from "@/modules/courses/models/structure.model";

export type StudySessionStatus = "IN_PROGRESS" | "COMPLETED";

export interface StudySession {
  id: string
  minutes: number
  status: StudySessionStatus
  startedAt: string
  studiedAt: string
  createdAt: string
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
}

export interface ManualSessionInput extends Scope {
  minutes: number
  studiedAt: string // dd/mm/aaaa
}
