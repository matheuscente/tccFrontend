import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { QuestionDTO } from "../models/DTO/QuestionDto";
import type { CreateQuestionDTO } from "../models/DTO/CreateQuestionDto";
import type { UpdateQuestionDTO } from "../models/DTO/UpdateQuestionDto";
import type { QuestionServiceInterface } from "../models/interfaces/QuestionService.interface";

export class QuestionService implements QuestionServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string, filter: ScopeFilterDTO = {}) {
    return this.api.get<QuestionDTO>(`/questions/user/${userId}`, { params: cleanParams(filter) });
  }

  findById(id: string) {
    return this.api.get<QuestionDTO>(`/questions/id/${id}`);
  }

  create(data: CreateQuestionDTO) {
    return this.api.post<QuestionDTO>("/questions", data);
  }

  update(id: string, data: UpdateQuestionDTO) {
    return this.api.patch<QuestionDTO>(`/questions/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/questions/${id}`);
  }
}

export const questionService = new QuestionService(api);
