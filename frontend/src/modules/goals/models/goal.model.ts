import type { Scope } from "@/modules/courses/models/structure.model";

export type GoalType = "DAILY_ONCE" | "DAILY_RECURRING" | "TOTAL_BY_DATE" | "TOTAL_IN_PERIOD";

export const goalTypeLabels: Record<GoalType, string> = {
  DAILY_ONCE: "Diária (um dia)",
  DAILY_RECURRING: "Diária recorrente",
  TOTAL_BY_DATE: "Total até uma data",
  TOTAL_IN_PERIOD: "Total no período",
};

export interface Goal {
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

export interface CreateGoalInput extends Scope {
  title: string
  type: GoalType
  targetMinutes: number
  startDate: string // dd/mm/aaaa
  endDate?: string | null
  userId?: string
}

export interface UpdateGoalInput {
  title?: string
  targetMinutes?: number
  endDate?: string | null
}

export type GoalProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "EXPIRED";

export const goalStatusInfo: Record<GoalProgressStatus, { label: string, color: string }> = {
  NOT_STARTED: { label: "Não iniciada", color: "grey" },
  IN_PROGRESS: { label: "Em andamento", color: "info" },
  ACHIEVED: { label: "Concluída", color: "success" },
  EXPIRED: { label: "Não atingida", color: "error" },
};

export interface GoalProgress {
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
