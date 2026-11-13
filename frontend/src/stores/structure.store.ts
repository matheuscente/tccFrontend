import { defineStore } from "pinia";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { useNotifyStore } from "./notify.store";
import { courseService } from "@/modules/courses/services/course.service";
import { moduleService } from "@/modules/courses/services/module.service";
import { disciplineService } from "@/modules/courses/services/discipline.service";
import type { CourseDTO } from "@/modules/courses/models/DTO/CourseDto";
import type { ModuleDTO } from "@/modules/courses/models/DTO/ModuleDto";
import type { DisciplineDTO } from "@/modules/courses/models/DTO/DisciplineDto";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ScopeLevel } from "@/modules/courses/models/Types/ScopeLevel";

export const useStructureStore = defineStore("structure", {
  state: () => ({
    courses: [] as CourseDTO[],
    modules: [] as ModuleDTO[],
    disciplines: [] as DisciplineDTO[],
    loadedFor: null as string | null,
    requestedFor: null as string | null,
    loading: false,
  }),

  getters: {
    courseById: (state) => (id?: string | null) => state.courses.find((course) => course.id === id),
    moduleById: (state) => (id?: string | null) => state.modules.find((module) => module.id === id),
    disciplineById: (state) => (id?: string | null) => state.disciplines.find((discipline) => discipline.id === id),
    modulesOf: (state) => (courseId?: string | null) => state.modules.filter((module) => module.courseId === courseId),
    disciplinesOf: (state) => (moduleId?: string | null) => state.disciplines.filter((discipline) => discipline.moduleId === moduleId),
  },

  actions: {
    async load(userId: string, force = false) {
      if (!userId || (!force && this.loadedFor === userId)) return;

      this.requestedFor = userId;
      this.loading = true;
      try {
        const [courses, modules, disciplines] = await Promise.all([
          courseService.listByUser(userId),
          moduleService.listByUser(userId),
          disciplineService.listByUser(userId),
        ]);

        this.courses = isError(courses) ? [] : courses.data;
        this.modules = isError(modules) ? [] : modules.data;
        this.disciplines = isError(disciplines) ? [] : disciplines.data;

        const error = [courses, modules, disciplines].find(isError);
        if (error) {
          this.loadedFor = null;
          useNotifyStore().error(firstErrorMessage(error));
          return;
        }
        this.loadedFor = userId;
      } finally {
        this.loading = false;
      }
    },

    reload() {
      if (this.requestedFor) return this.load(this.requestedFor, true);
    },

    clear() {
      this.courses = [];
      this.modules = [];
      this.disciplines = [];
      this.loadedFor = null;
      this.requestedFor = null;
    },

    // ids de todos os níveis acima do vínculo (a API grava só o mais específico)
    resolve(scope: Scope): Required<Scope> {
      const discipline = this.disciplineById(scope.disciplineId);
      const moduleId = scope.moduleId ?? discipline?.moduleId ?? null;
      const courseId = scope.courseId ?? this.moduleById(moduleId)?.courseId ?? null;
      return { courseId, moduleId, disciplineId: scope.disciplineId ?? null };
    },

    // o item pertence ao escopo ou a algum nível dentro dele
    contains(container: Scope, item: Scope): boolean {
      const resolved = this.resolve(item);
      if (container.disciplineId) return resolved.disciplineId === container.disciplineId;
      if (container.moduleId) return resolved.moduleId === container.moduleId;
      if (container.courseId) return resolved.courseId === container.courseId;
      return true;
    },

    describe(scope: Scope): { level: ScopeLevel | null, path: string[] } {
      if (scope.disciplineId) {
        const discipline = this.disciplineById(scope.disciplineId);
        const module = this.moduleById(discipline?.moduleId);
        const course = this.courseById(module?.courseId);
        return { level: "discipline", path: [course?.title, module?.title, discipline?.title ?? "Disciplina removida"].filter(Boolean) as string[] };
      }
      if (scope.moduleId) {
        const module = this.moduleById(scope.moduleId);
        const course = this.courseById(module?.courseId);
        return { level: "module", path: [course?.title, module?.title ?? "Módulo removido"].filter(Boolean) as string[] };
      }
      if (scope.courseId) {
        return { level: "course", path: [this.courseById(scope.courseId)?.title ?? "Curso removido"] };
      }
      return { level: null, path: [] };
    },
  },
});
