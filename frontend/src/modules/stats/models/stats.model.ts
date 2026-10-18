export interface StudySummary {
  startDate: string
  endDate: string
  totalMinutes: number
  sessionsCount: number
  averageMinutesPerDay: number
  studiedDays: number
  currentStreak: number
  perDay: { date: string, minutes: number }[]
  byScope: { scopeId: string, scope: "course" | "module" | "discipline", title: string, minutes: number }[]
}

export interface Performance {
  totalAttempts: number
  averageScore: number | null
  bestScore: number | null
  timeline: { attemptId: string, activityId: string, activityTitle: string, date: string, score: number }[]
  byActivity: { activityId: string, title: string, attempts: number, averageScore: number, bestScore: number, lastScore: number }[]
}

export interface StatsQuery {
  userId?: string
  startDate?: string // dd/mm/aaaa
  endDate?: string
  courseId?: string
  moduleId?: string
  disciplineId?: string
}
