import { Service } from "@/services/abstract/service.abstract";
import { http } from "./api";

// instância única usada pelos services dos módulos
export const api = new Service(http);
