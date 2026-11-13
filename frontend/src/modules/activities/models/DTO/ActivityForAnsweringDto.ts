import type { QuestionDTO } from "@/modules/questions/models/DTO/QuestionDto";

export interface ActivityForAnsweringDTO {
  id: string
  title: string
  description: string | null
  questions: QuestionDTO[]
}
