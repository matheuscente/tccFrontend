import type { ScopeLevel } from "@/modules/courses/models/Types/ScopeLevel";

export interface StudySummaryDTO {
  startDate: string
  endDate: string
  totalMinutes: number
  sessionsCount: number
  averageMinutesPerDay: number
  studiedDays: number
  currentStreak: number
  perDay: { date: string, minutes: number }[]
  byScope: { scopeId: string, scope: ScopeLevel, title: string, minutes: number }[]
}
