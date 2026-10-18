import { api } from "@/services/api/http";
import { cleanParams } from "@/utils/params";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { ListFilter } from "@/modules/questions/models/question.model";
import type { FileAccess, StoredFile } from "../models/file.model";

export const fileService = {
  listByUser: (userId: string, filter: ListFilter = {}) => api.get<StoredFile>(`/files/user/${userId}`, { params: cleanParams(filter) }),
  upload: (file: File, scope: Scope, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    Object.entries(cleanParams(scope)).forEach(([key, value]) => form.append(key, String(value)));

    return api.post<StoredFile>("/files", form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
  access: (id: string) => api.get<FileAccess>(`/files/${id}/access`),
  update: (id: string, data: Scope & { originalName?: string }) => api.patch<StoredFile>(`/files/${id}`, data),
  remove: (id: string) => api.delete(`/files/${id}`),
};
