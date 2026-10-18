import type { TicketStatus } from "@/modules/tickets/models/ticket.model";

export interface AdminDashboard {
  users: { total: number, newLast30Days: number, activeLast7Days: number, admins: number }
  study: { totalMinutes: number, minutesLast30Days: number, sessionsLast30Days: number, perDay: { date: string, minutes: number }[] }
  content: { courses: number, modules: number, disciplines: number, goals: number, questions: number, activities: number, notes: number, files: number }
  activities: { attemptsLast30Days: number, averageScoreLast30Days: number | null }
  tickets: Record<TicketStatus, number>
  recentUsers: { id: string, name: string, username: string, email: string, createdAt: string }[]
}

export interface AdminUserOverview {
  user: { id: string, name: string, username: string, email: string, role: "ADMIN" | "USER", birthDate: string, createdAt: string }
  counts: { courses: number, modules: number, disciplines: number, goals: number, questions: number, activities: number, notes: number, files: number, tickets: number }
  study: { totalMinutes: number, minutesLast30Days: number, sessions: number, lastStudyAt: string | null }
  activities: { attempts: number, averageScore: number | null, bestScore: number | null }
  storage: { files: number, bytes: number }
}
