import type { ApiResult } from "@/services/abstract/service.abstract";
import type { CreateTicketDTO } from "../DTO/CreateTicketDto";
import type { TicketDetailDTO } from "../DTO/TicketDetailDto";
import type { TicketDTO } from "../DTO/TicketDto";
import type { TicketFilterDTO } from "../DTO/TicketFilterDto";
import type { TicketStatus } from "../Types/TicketStatus";

export interface TicketServiceInterface {
  list(filter?: TicketFilterDTO): Promise<ApiResult<TicketDTO>>
  findById(id: string): Promise<ApiResult<TicketDetailDTO>>
  create(data: CreateTicketDTO, images: File[]): Promise<ApiResult<TicketDetailDTO>>
  reply(id: string, message: string, images: File[]): Promise<ApiResult<TicketDetailDTO>>
  updateStatus(id: string, status: TicketStatus): Promise<ApiResult<TicketDetailDTO>>
}
