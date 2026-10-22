import type { StudySessionStatus } from "../Types/StudySessionStatus";

export interface StudySessionDTO {
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
