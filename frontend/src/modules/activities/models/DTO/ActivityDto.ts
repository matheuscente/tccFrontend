import type { QuestionDTO } from "@/modules/questions/models/DTO/QuestionDto";

export interface ActivityDTO {
  id: string
  title: string
  description: string | null
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  questionCount: number
  attemptCount: number
  bestScore: number | null
  lastScore: number | null
  lastAttemptAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ActivityDetailDTO extends ActivityDTO {
  questions: QuestionDTO[]
}
