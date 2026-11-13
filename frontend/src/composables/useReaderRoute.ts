import type { RouteLocationRaw } from "vue-router";
import { useStructureStore } from "@/stores/structure.store";
import { routeProps } from "@/router/RouteProps";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";

// endereço do modo estudo (leitura) de um curso, módulo ou disciplina
export const useReaderRoute = () => {
  const structure = useStructureStore();

  return (scope: Scope): RouteLocationRaw | null => {
    const { courseId, moduleId, disciplineId } = structure.resolve(scope);
    if (courseId && moduleId && disciplineId) return { name: routeProps.disciplineReader.name, params: { id: courseId, moduleId, disciplineId } };
    if (courseId && moduleId) return { name: routeProps.moduleReader.name, params: { id: courseId, moduleId } };
    if (courseId) return { name: routeProps.courseReader.name, params: { id: courseId } };
    return null;
  };
};
