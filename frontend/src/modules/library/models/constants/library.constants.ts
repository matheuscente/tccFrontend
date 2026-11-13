import { routeProps } from "@/router/RouteProps";
import type { LibraryTab } from "../Types/LibraryTab";

export const libraryTabs: { value: LibraryTab, title: string, icon: string }[] = [
  { value: "files", title: "Materiais", icon: "mdi-file-document-multiple-outline" },
  { value: "notes", title: "Notas", icon: "mdi-notebook-outline" },
  { value: "questions", title: "Questões", icon: "mdi-help-box-multiple-outline" },
  { value: "activities", title: "Atividades", icon: "mdi-clipboard-check-outline" },
];

export const libraryRoute = (tab: LibraryTab) => ({ name: routeProps.library.name, query: { tab } });
