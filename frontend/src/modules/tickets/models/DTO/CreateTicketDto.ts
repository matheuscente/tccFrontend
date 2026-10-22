import type { TicketCategory } from "../Types/TicketCategory";

export interface CreateTicketDTO {
  subject: string
  category: TicketCategory
  message: string
}
