export interface SubmitAttemptDTO {
  startedAt: string
  answers: { questionId: string, optionId: string | null }[]
}
