import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { FileAccessDTO } from "../models/DTO/FileAccessDto";
import type { StoredFileDTO } from "../models/DTO/StoredFileDto";
import type { UpdateFileDTO } from "../models/DTO/UpdateFileDto";
import type { FileServiceInterface } from "../models/interfaces/FileService.interface";

export class FileService implements FileServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  listByUser(userId: string, filter: ScopeFilterDTO = {}) {
    return this.api.get<StoredFileDTO>(`/files/user/${userId}`, { params: cleanParams(filter) });
  }

  upload(file: File, scope: Scope, onProgress?: (percent: number) => void) {
    const form = new FormData();
    form.append("file", file);
    Object.entries(cleanParams(scope)).forEach(([key, value]) => form.append(key, String(value)));

    return this.api.post<StoredFileDTO>("/files", form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  }

  access(id: string) {
    return this.api.get<FileAccessDTO>(`/files/${id}/access`);
  }

  update(id: string, data: UpdateFileDTO) {
    return this.api.patch<StoredFileDTO>(`/files/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<unknown>(`/files/${id}`);
  }
}

export const fileService = new FileService(api);
