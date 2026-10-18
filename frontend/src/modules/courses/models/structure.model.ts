export interface Course {
  id: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Discipline {
  id: string
  moduleId: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface TitledInput {
  title: string
  description?: string | null
}

/** Escopo usado por metas, sessões, questões, atividades, notas e arquivos. */
export interface Scope {
  courseId?: string | null
  moduleId?: string | null
  disciplineId?: string | null
}

export type ScopeLevel = "course" | "module" | "discipline"
