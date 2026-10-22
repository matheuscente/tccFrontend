import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { QuestionType } from "../Types/QuestionType";

export interface QuestionOptionInputDTO {
  text: string
  isCorrect: boolean
}

export interface CreateQuestionDTO extends Scope {
  statement: string
  type: QuestionType
  explanation?: string | null
  options: QuestionOptionInputDTO[]
}
