import type { RouteLocationRaw } from "vue-router";
import { useStructureStore } from "@/stores/structure.store";
import { routeProps } from "@/router/RouteProps";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { HubTab } from "@/modules/courses/models/Types/HubTab";

// endereço da página de estudo (curso, módulo ou disciplina) de um vínculo
export const useHubRoute = () => {
  const structure = useStructureStore();

  return (scope: Scope, tab?: HubTab): RouteLocationRaw | null => {
    const { courseId, moduleId, disciplineId } = structure.resolve(scope);
    const query = tab && tab !== "overview" ? { tab } : {};
    if (courseId && moduleId && disciplineId) {
      return { name: routeProps.disciplineDetail.name, params: { id: courseId, moduleId, disciplineId }, query };
    }
    if (courseId && moduleId) return { name: routeProps.moduleDetail.name, params: { id: courseId, moduleId }, query };
    if (courseId) return { name: routeProps.courseDetail.name, params: { id: courseId }, query };
    return null;
  };
};
