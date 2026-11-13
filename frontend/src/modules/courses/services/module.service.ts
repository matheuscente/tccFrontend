import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { ModuleDTO } from "../models/DTO/ModuleDto";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";
import type { ModuleServiceInterface } from "../models/interfaces/ModuleService.interface";

export class ModuleService implements ModuleServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<ModuleDTO>(`/modules/user/${userId}`);
  }

  listByCourse(courseId: string) {
    return this.api.get<ModuleDTO>(`/modules/course/${courseId}`);
  }

  findById(id: string) {
    return this.api.get<ModuleDTO>(`/modules/id/${id}`);
  }

  create(courseId: string, data: TitledInputDTO) {
    return this.api.post<ModuleDTO>("/modules", { ...data, courseId });
  }

  update(id: string, data: Partial<TitledInputDTO>) {
    return this.api.patch<ModuleDTO>(`/modules/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/modules/${id}`);
  }
}

export const moduleService = new ModuleService(api);
