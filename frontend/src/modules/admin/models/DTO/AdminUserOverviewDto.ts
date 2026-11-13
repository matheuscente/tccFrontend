import type { UserRole } from "@/modules/user/models/Types/UserRole";

export interface AdminUserOverviewDTO {
  user: { id: string, name: string, username: string, email: string, role: UserRole, birthDate: string, createdAt: string }
  counts: { courses: number, modules: number, disciplines: number, goals: number, questions: number, activities: number, notes: number, files: number, tickets: number }
  study: { totalMinutes: number, minutesLast30Days: number, sessions: number, lastStudyAt: string | null }
  activities: { attempts: number, averageScore: number | null, bestScore: number | null }
  storage: { files: number, bytes: number }
}
