import type { Scope } from "@/modules/courses/models/structure.model";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

export const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  TRUE_FALSE: "Verdadeiro ou falso",
};

export interface QuestionOption {
  id: string
  text: string
  order: number
  isCorrect?: boolean
}

export interface Question {
  id: string
  statement: string
  type: QuestionType
  explanation: string | null
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  options: QuestionOption[]
  createdAt: string
  updatedAt: string
}

export interface QuestionOptionInput {
  text: string
  isCorrect: boolean
}

export interface CreateQuestionInput extends Scope {
  statement: string
  type: QuestionType
  explanation?: string | null
  options: QuestionOptionInput[]
}

export interface UpdateQuestionInput {
  statement?: string
  explanation?: string | null
  options?: QuestionOptionInput[]
}

export interface ListFilter extends Scope {
  search?: string
}
