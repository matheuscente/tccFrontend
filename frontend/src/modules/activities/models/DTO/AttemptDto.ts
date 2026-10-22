export interface AttemptAnswerResultDTO {
  questionId: string
  statement: string
  explanation: string | null
  selectedOptionId: string | null
  correctOptionId: string | null
  isCorrect: boolean
  options: { id: string, text: string }[]
}

export interface AttemptDTO {
  id: string
  activityId: string
  activityTitle: string
  correctCount: number
  totalQuestions: number
  score: number
  startedAt: string
  finishedAt: string
  durationSeconds: number
  answers?: AttemptAnswerResultDTO[]
}
