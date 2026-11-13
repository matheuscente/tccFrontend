import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import type { DisciplineDTO } from "../models/DTO/DisciplineDto";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";
import type { DisciplineServiceInterface } from "../models/interfaces/DisciplineService.interface";

export class DisciplineService implements DisciplineServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string) {
    return this.api.get<DisciplineDTO>(`/disciplines/user/${userId}`);
  }

  listByModule(moduleId: string) {
    return this.api.get<DisciplineDTO>(`/disciplines/module/${moduleId}`);
  }

  findById(id: string) {
    return this.api.get<DisciplineDTO>(`/disciplines/id/${id}`);
  }

  create(moduleId: string, data: TitledInputDTO) {
    return this.api.post<DisciplineDTO>("/disciplines", { ...data, moduleId });
  }

  update(id: string, data: Partial<TitledInputDTO>) {
    return this.api.patch<DisciplineDTO>(`/disciplines/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/disciplines/${id}`);
  }
}

export const disciplineService = new DisciplineService(api);
