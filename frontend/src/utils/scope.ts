import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

export const scopeOf = (item: Scope): Scope =>
  item.disciplineId ? { disciplineId: item.disciplineId } : item.moduleId ? { moduleId: item.moduleId } : item.courseId ? { courseId: item.courseId } : {};

export const sameScope = (a: Scope, b: Scope) =>
  (a.courseId ?? null) === (b.courseId ?? null) &&
  (a.moduleId ?? null) === (b.moduleId ?? null) &&
  (a.disciplineId ?? null) === (b.disciplineId ?? null);

export const hasScope = (scope?: Scope | null) => !!(scope?.courseId || scope?.moduleId || scope?.disciplineId);

export const scopeQuery = (scope: Scope): { courseId?: string, moduleId?: string, disciplineId?: string } => ({
  ...(scope.courseId ? { courseId: scope.courseId } : {}),
  ...(scope.moduleId ? { moduleId: scope.moduleId } : {}),
  ...(scope.disciplineId ? { disciplineId: scope.disciplineId } : {}),
});
