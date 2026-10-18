import { api } from "@/services/api/http";
import type { Course, Discipline, Module, TitledInput } from "../models/structure.model";

export const courseService = {
  listByUser: (userId: string) => api.get<Course>(`/courses/user/${userId}`),
  findById: (id: string) => api.get<Course>(`/courses/id/${id}`),
  create: (userId: string, data: TitledInput) => api.post<Course>("/courses", { ...data, userId }),
  update: (id: string, data: Partial<TitledInput>) => api.patch<Course>(`/courses/${id}`, data),
  remove: (id: string) => api.delete(`/courses/${id}`),
};

export const moduleService = {
  listByUser: (userId: string) => api.get<Module>(`/modules/user/${userId}`),
  listByCourse: (courseId: string) => api.get<Module>(`/modules/course/${courseId}`),
  findById: (id: string) => api.get<Module>(`/modules/id/${id}`),
  create: (courseId: string, data: TitledInput) => api.post<Module>("/modules", { ...data, courseId }),
  update: (id: string, data: Partial<TitledInput>) => api.patch<Module>(`/modules/${id}`, data),
  remove: (id: string) => api.delete(`/modules/${id}`),
};

export const disciplineService = {
  listByUser: (userId: string) => api.get<Discipline>(`/disciplines/user/${userId}`),
  listByModule: (moduleId: string) => api.get<Discipline>(`/disciplines/module/${moduleId}`),
  findById: (id: string) => api.get<Discipline>(`/disciplines/id/${id}`),
  create: (moduleId: string, data: TitledInput) => api.post<Discipline>("/disciplines", { ...data, moduleId }),
  update: (id: string, data: Partial<TitledInput>) => api.patch<Discipline>(`/disciplines/${id}`, data),
  remove: (id: string) => api.delete(`/disciplines/${id}`),
};
