import type { ApiErrorItem } from "./ApiErrorItem.interface";

export interface ApiError {
  statusCode: number;
  state: "error";
  data: ApiErrorItem[];
}
