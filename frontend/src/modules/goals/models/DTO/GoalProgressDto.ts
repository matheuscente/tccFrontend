import type { GoalProgressStatus } from "../Types/GoalProgressStatus";
import type { GoalType } from "../Types/GoalType";

export interface GoalProgressDTO {
  goalId: string
  title: string
  type: GoalType
  targetMinutes: number
  studiedMinutes: number
  percent: number
  status: GoalProgressStatus
  startDate: string
  endDate: string | null
  scope: { courseId: string | null, moduleId: string | null, disciplineId: string | null }
  daysAchieved?: number
  totalDays?: number
}
