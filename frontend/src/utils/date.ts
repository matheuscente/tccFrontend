const pad = (value: number) => String(value).padStart(2, "0");

/** "2025-12-31" (input type=date) -> "31/12/2025" (formato da API) */
export const inputToApiDate = (value: string): string => {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/** ISO da API -> "2025-12-31" para input type=date (datas da API são meia-noite UTC) */
export const isoToInputDate = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");

/** Data de hoje no formato do input type=date, no fuso do navegador */
export const todayInput = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const todayApi = (): string => inputToApiDate(todayInput());

/** Formata uma data "dia" (meia-noite UTC) sem deslocar pelo fuso. */
export const formatDay = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

/** Formata data e hora no fuso do navegador. */
export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export const formatMinutes = (minutes: number): string => {
  if (!minutes) return "0 min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
};

/** "2025-12-31" -> "31/12" (rótulos de gráfico) */
export const shortDay = (key: string): string => {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
};
