import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { GoalType } from "../Types/GoalType";

export interface CreateGoalDTO extends Scope {
  title: string
  type: GoalType
  targetMinutes: number
  startDate: string
  endDate?: string | null
  userId?: string
}
