import { Service } from "@/services/abstract/service.abstract";
import { http } from "./api";

export const api = new Service(http);
