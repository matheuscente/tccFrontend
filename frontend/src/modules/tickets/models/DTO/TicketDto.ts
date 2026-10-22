import type { TicketCategory } from "../Types/TicketCategory";
import type { TicketStatus } from "../Types/TicketStatus";

export interface TicketUserDTO {
  id: string
  name: string
  username: string
}

export interface TicketDTO {
  id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  user: TicketUserDTO
  messageCount: number
  lastMessageAt: string | null
  lastMessageByAdmin: boolean
  createdAt: string
  updatedAt: string
  closedAt: string | null
}
