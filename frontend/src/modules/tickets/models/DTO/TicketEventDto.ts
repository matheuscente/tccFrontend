import type { TicketEventType } from "../Types/TicketEventType";
import type { TicketStatus } from "../Types/TicketStatus";

export interface TicketEventDTO {
  id: string
  type: TicketEventType
  status: TicketStatus | null
  actor: { id: string, name: string }
  target: { id: string, name: string } | null
  createdAt: string
}
