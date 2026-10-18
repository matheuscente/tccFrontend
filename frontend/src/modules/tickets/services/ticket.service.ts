import { api } from "@/services/api/http";
import { cleanParams } from "@/utils/params";
import type { Ticket, TicketCategory, TicketDetail, TicketStatus } from "../models/ticket.model";

const toForm = (fields: Record<string, string>, images: File[]) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  images.forEach((image) => form.append("images", image));
  return form;
};

export const ticketService = {
  list: (filter: { status?: TicketStatus | null, search?: string } = {}) => api.get<Ticket>("/tickets", { params: cleanParams(filter) }),
  findById: (id: string) => api.get<TicketDetail>(`/tickets/id/${id}`),
  create: (data: { subject: string, category: TicketCategory, message: string }, images: File[]) =>
    api.post<TicketDetail>("/tickets", toForm(data, images)),
  reply: (id: string, message: string, images: File[]) => api.post<TicketDetail>(`/tickets/${id}/messages`, toForm({ message }, images)),
  updateStatus: (id: string, status: TicketStatus) => api.patch<TicketDetail>(`/tickets/${id}/status`, { status }),
};
