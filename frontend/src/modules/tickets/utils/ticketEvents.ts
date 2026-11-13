import type { TicketEventDTO } from "../models/DTO/TicketEventDto";
import { ticketStatusInfo } from "../models/constants/ticket.constants";

// texto do histórico; ownerId distingue o encerramento feito pelo próprio usuário do feito pelo suporte
export const describeTicketEvent = (event: TicketEventDTO, ownerId: string): { text: string, icon: string } => {
  if (event.type === "ASSIGNED") return { text: `${event.actor.name} começou a atender o chamado`, icon: "mdi-account-check-outline" };
  if (event.type === "TRANSFERRED") return { text: `${event.actor.name} transferiu o atendimento para ${event.target?.name ?? "outro administrador"}`, icon: "mdi-account-switch-outline" };
  if (event.status === "CLOSED") {
    return {
      text: event.actor.id === ownerId ? `Encerrado pelo usuário (${event.actor.name})` : `Encerrado pelo administrador ${event.actor.name}`,
      icon: "mdi-lock-outline",
    };
  }
  const label = event.status ? ticketStatusInfo[event.status].label : "";
  return { text: `${event.actor.name} alterou o status para ${label}`, icon: "mdi-swap-horizontal" };
};
