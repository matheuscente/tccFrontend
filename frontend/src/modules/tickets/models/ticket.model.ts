export type TicketCategory = "DOUBT" | "PROBLEM" | "SUGGESTION";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  DOUBT: "Dúvida",
  PROBLEM: "Problema técnico",
  SUGGESTION: "Sugestão",
};

export const ticketStatusInfo: Record<TicketStatus, { label: string, color: string, icon: string }> = {
  OPEN: { label: "Aberto", color: "warning", icon: "mdi-email-open-outline" },
  IN_PROGRESS: { label: "Em atendimento", color: "info", icon: "mdi-progress-wrench" },
  ANSWERED: { label: "Respondido", color: "success", icon: "mdi-reply" },
  CLOSED: { label: "Encerrado", color: "grey", icon: "mdi-lock-outline" },
};

export interface TicketUser {
  id: string
  name: string
  username: string
}

export interface Ticket {
  id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  user: TicketUser
  messageCount: number
  lastMessageAt: string | null
  lastMessageByAdmin: boolean
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface TicketAttachment {
  id: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

export interface TicketMessage {
  id: string
  content: string
  createdAt: string
  author: { id: string, name: string, role: "ADMIN" | "USER" }
  attachments: TicketAttachment[]
}

export interface TicketDetail extends Omit<Ticket, "messageCount" | "lastMessageAt" | "lastMessageByAdmin"> {
  messages: TicketMessage[]
}
