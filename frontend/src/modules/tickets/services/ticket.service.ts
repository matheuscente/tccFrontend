import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { CreateTicketDTO } from "../models/DTO/CreateTicketDto";
import type { TicketDetailDTO } from "../models/DTO/TicketDetailDto";
import type { TicketDTO } from "../models/DTO/TicketDto";
import type { TicketFilterDTO } from "../models/DTO/TicketFilterDto";
import type { TicketStatus } from "../models/Types/TicketStatus";
import type { TicketServiceInterface } from "../models/interfaces/TicketService.interface";

const toForm = (fields: Record<string, string>, images: File[]) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  images.forEach((image) => form.append("images", image));
  return form;
};

export class TicketService implements TicketServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  list(filter: TicketFilterDTO = {}) {
    return this.api.get<TicketDTO>("/tickets", { params: cleanParams(filter) });
  }

  findById(id: string) {
    return this.api.get<TicketDetailDTO>(`/tickets/id/${id}`);
  }

  create(data: CreateTicketDTO, images: File[]) {
    return this.api.post<TicketDetailDTO>("/tickets", toForm({ ...data }, images));
  }

  reply(id: string, message: string, images: File[]) {
    return this.api.post<TicketDetailDTO>(`/tickets/${id}/messages`, toForm({ message }, images));
  }

  updateStatus(id: string, status: TicketStatus) {
    return this.api.patch<TicketDetailDTO>(`/tickets/${id}/status`, { status });
  }
}

export const ticketService = new TicketService(api);
