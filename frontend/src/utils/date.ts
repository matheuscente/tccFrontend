const pad = (value: number) => String(value).padStart(2, "0");

// input type=date ("aaaa-mm-dd") -> formato exigido pela API ("dd/mm/aaaa")
export const inputToApiDate = (value: string): string => {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

// datas "dia" da API vêm como meia-noite UTC: corta a string em vez de converter pelo fuso
export const isoToInputDate = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");

export const toInputDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayInput = (): string => toInputDate(new Date());

export const todayApi = (): string => inputToApiDate(todayInput());

export const formatDay = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

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

export const shortDay = (key: string): string => {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
};
