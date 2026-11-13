import type { ActivityDTO } from "@/modules/activities/models/DTO/ActivityDto";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ScopeLevel } from "@/modules/courses/models/Types/ScopeLevel";
import type { ReaderItem } from "../Types/ReaderItem";

export interface ReaderSection {
  id: string
  title: string
  description: string | null
  level: ScopeLevel
  depth: number
  scope: Scope
  items: ReaderItem[]
  activities: ActivityDTO[]
}
