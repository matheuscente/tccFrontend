import type { Scope } from "../interfaces/Scope.interface";

export interface ScopeFilterDTO extends Scope {
  search?: string
}
