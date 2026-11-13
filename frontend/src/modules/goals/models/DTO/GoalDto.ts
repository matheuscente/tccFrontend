import type { GoalType } from "../Types/GoalType";

export interface GoalDTO {
  id: string
  title: string
  type: GoalType
  targetMinutes: number
  startDate: string
  endDate: string | null
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  createdAt: string
  updatedAt: string
}
