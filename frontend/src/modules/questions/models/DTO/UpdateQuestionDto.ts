import type { QuestionOptionInputDTO } from "./CreateQuestionDto";

export interface UpdateQuestionDTO {
  statement?: string
  explanation?: string | null
  options?: QuestionOptionInputDTO[]
}
