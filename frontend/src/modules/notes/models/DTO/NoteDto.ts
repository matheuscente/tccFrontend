export interface NoteDTO {
  id: string
  title: string
  content: string
  position: number | null
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  createdAt: string
  updatedAt: string
}
