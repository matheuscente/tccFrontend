import { todayInput } from "./date";

type Rule = (value: unknown) => true | string;

export const required = (label = "Campo"): Rule => (value) =>
  (value !== null && value !== undefined && String(value).trim() !== "") || `${label} é obrigatório.`;

export const minLength = (min: number, label = "Campo"): Rule => (value) =>
  !value || String(value).trim().length >= min || `${label} deve ter pelo menos ${min} caracteres.`;

export const maxLength = (max: number, label = "Campo"): Rule => (value) =>
  !value || String(value).length <= max || `${label} deve ter no máximo ${max} caracteres.`;

export const email: Rule = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) || "Informe um e-mail válido.";

export const username: Rule = (value) =>
  !value || /^[a-zA-Z0-9_]+$/.test(String(value)) || "Use apenas letras, números e _.";

export const strongPassword: Rule = (value) => {
  const text = String(value ?? "");
  if (text.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-z]/.test(text)) return "A senha precisa de uma letra minúscula.";
  if (!/[A-Z]/.test(text)) return "A senha precisa de uma letra maiúscula.";
  if (!/[0-9]/.test(text)) return "A senha precisa de um número.";
  return true;
};

export const positiveInteger = (label = "Valor"): Rule => (value) =>
  (Number.isInteger(Number(value)) && Number(value) > 0) || `${label} deve ser um número inteiro maior que zero.`;

export const notFuture: Rule = (value) => {
  if (!value) return true;
  return String(value) <= todayInput() || "A data não pode ser futura.";
};
