import type { ApiError } from "./models/ApiError.interface";

export function isError(body: unknown): body is ApiError {
  return typeof body === "object" && body !== null && (body as ApiError).state === "error";
}