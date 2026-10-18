import type { ApiError } from "@/services/api/models/ApiError.interface";

/**
 * Separa os erros da API em erros de campo (para :error-messages) e erro geral (para alert/snackbar).
 */
export const splitApiErrors = (error: ApiError): { fields: Record<string, string>, general: string | undefined } => {
  const fields: Record<string, string> = {};
  const general: string[] = [];

  error.data.forEach((item) => {
    if (item.field) {
      const key = item.field.split(".")[0] ?? item.field;
      fields[key] = fields[key] ? `${fields[key]} ${item.message}` : item.message;
    } else {
      general.push(item.message);
    }
  });

  return { fields, general: general.length ? general.join("\n") : undefined };
};

export const firstErrorMessage = (error: ApiError): string =>
  error.data.map((item) => item.message).join("\n") || "Ocorreu um erro inesperado.";
