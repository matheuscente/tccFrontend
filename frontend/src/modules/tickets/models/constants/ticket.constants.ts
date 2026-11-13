import type { TicketCategory } from "../Types/TicketCategory";
import type { TicketStatus } from "../Types/TicketStatus";

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
