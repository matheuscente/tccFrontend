import { defineStore } from "pinia";
import { isError } from "@/services/api/isError.typeGuard";
import { courseService, disciplineService, moduleService } from "@/modules/courses/services/structure.service";
import type { Course, Discipline, Module, Scope, ScopeLevel } from "@/modules/courses/models/structure.model";

/**
 * Cache da estrutura curso > módulo > disciplina do usuário logado.
 * Usado pelos seletores de escopo e para exibir os nomes nas listas.
 */
export const useStructureStore = defineStore("structure", {
  state: () => ({
    courses: [] as Course[],
    modules: [] as Module[],
    disciplines: [] as Discipline[],
    loadedFor: null as string | null,
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
        this.loadedFor = userId;
      } finally {
        this.loading = false;
      }
    },

    reload() {
      if (this.loadedFor) return this.load(this.loadedFor, true);
    },

    clear() {
      this.courses = [];
      this.modules = [];
      this.disciplines = [];
      this.loadedFor = null;
    },

    /** Nível e caminho legível de um escopo, ex.: "Curso › Módulo › Disciplina". */
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
