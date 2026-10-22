import type { TicketStatus } from "../Types/TicketStatus";

export interface TicketFilterDTO {
  status?: TicketStatus | null
  search?: string
}
