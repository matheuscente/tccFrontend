import type { Scope } from "@/modules/courses/models/structure.model";
import type { Question } from "@/modules/questions/models/question.model";

export interface Activity {
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

export interface ActivityDetail extends Activity {
  questions: Question[]
}

export interface ActivityForAnswering {
  id: string
  title: string
  description: string | null
  questions: Question[]
}

export interface CreateActivityInput extends Scope {
  title: string
  description?: string | null
  questionIds?: string[]
}

export interface AttemptAnswerResult {
  questionId: string
  statement: string
  explanation: string | null
  selectedOptionId: string | null
  correctOptionId: string | null
  isCorrect: boolean
  options: { id: string, text: string }[]
}

export interface Attempt {
  id: string
  activityId: string
  activityTitle: string
  correctCount: number
  totalQuestions: number
  score: number
  startedAt: string
  finishedAt: string
  durationSeconds: number
  answers?: AttemptAnswerResult[]
}

export interface SubmitAttemptInput {
  startedAt: string
  answers: { questionId: string, optionId: string | null }[]
}
