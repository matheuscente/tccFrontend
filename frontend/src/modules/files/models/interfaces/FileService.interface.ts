import type { ApiResult } from "@/services/abstract/service.abstract";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ScopeFilterDTO } from "@/modules/courses/models/DTO/ScopeFilterDto";
import type { FileAccessDTO } from "../DTO/FileAccessDto";
import type { StoredFileDTO } from "../DTO/StoredFileDto";
import type { UpdateFileDTO } from "../DTO/UpdateFileDto";

export interface FileServiceInterface {
  listByUser(userId: string, filter?: ScopeFilterDTO): Promise<ApiResult<StoredFileDTO>>
  upload(file: File, scope: Scope, onProgress?: (percent: number) => void, position?: number): Promise<ApiResult<StoredFileDTO>>
  access(id: string): Promise<ApiResult<FileAccessDTO>>
  update(id: string, data: UpdateFileDTO): Promise<ApiResult<StoredFileDTO>>
  remove(id: string): Promise<ApiResult<unknown>>
}
