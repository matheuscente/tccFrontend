import type { UserRole } from "@/modules/user/models/Types/UserRole";
import type { TicketDTO } from "./TicketDto";

export interface TicketAttachmentDTO {
  id: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

export interface TicketMessageDTO {
  id: string
  content: string
  createdAt: string
  author: { id: string, name: string, role: UserRole }
  attachments: TicketAttachmentDTO[]
}

export interface TicketDetailDTO extends Omit<TicketDTO, "messageCount" | "lastMessageAt" | "lastMessageByAdmin"> {
  messages: TicketMessageDTO[]
}
