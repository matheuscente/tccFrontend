import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { CourseDTO } from "../models/DTO/CourseDto";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";
import type { CourseServiceInterface } from "../models/interfaces/CourseService.interface";

export class CourseService implements CourseServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<CourseDTO>(`/courses/user/${userId}`);
  }

  findById(id: string) {
    return this.api.get<CourseDTO>(`/courses/id/${id}`);
  }

  create(userId: string, data: TitledInputDTO) {
    return this.api.post<CourseDTO>("/courses", { ...data, userId });
  }

  update(id: string, data: Partial<TitledInputDTO>) {
    return this.api.patch<CourseDTO>(`/courses/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/courses/${id}`);
  }
}

export const courseService = new CourseService(api);
