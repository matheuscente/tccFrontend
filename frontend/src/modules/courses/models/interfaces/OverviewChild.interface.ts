import type { RouteLocationRaw } from "vue-router";
import type { Scope } from "./Scope.interface";

export interface OverviewChild {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  to: RouteLocationRaw
  scope: Scope
}
