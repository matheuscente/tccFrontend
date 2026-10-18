import { api } from "@/services/api/http";
import type { CreateQuestionInput, ListFilter, Question, UpdateQuestionInput } from "../models/question.model";
import { cleanParams } from "@/utils/params";

export const questionService = {
  listByUser: (userId: string, filter: ListFilter = {}) => api.get<Question>(`/questions/user/${userId}`, { params: cleanParams(filter) }),
  findById: (id: string) => api.get<Question>(`/questions/id/${id}`),
  create: (data: CreateQuestionInput) => api.post<Question>("/questions", data),
  update: (id: string, data: UpdateQuestionInput) => api.patch<Question>(`/questions/${id}`, data),
  remove: (id: string) => api.delete(`/questions/${id}`),
};
