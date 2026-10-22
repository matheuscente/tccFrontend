import type { QuestionType } from "../Types/QuestionType";

export interface QuestionOptionDTO {
  id: string
  text: string
  order: number
  isCorrect?: boolean
}

export interface QuestionDTO {
  id: string
  statement: string
  type: QuestionType
  explanation: string | null
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  options: QuestionOptionDTO[]
  createdAt: string
  updatedAt: string
}
