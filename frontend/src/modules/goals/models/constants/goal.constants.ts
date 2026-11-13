import type { GoalProgressStatus } from "../Types/GoalProgressStatus";
import type { GoalType } from "../Types/GoalType";

export const goalTypeLabels: Record<GoalType, string> = {
  DAILY_ONCE: "Diária (um dia)",
  DAILY_RECURRING: "Diária recorrente",
  TOTAL_BY_DATE: "Total até uma data",
  TOTAL_IN_PERIOD: "Total no período",
};

export const goalTypeHints: Record<GoalType, string> = {
  DAILY_ONCE: "Estudar o tempo definido em um único dia.",
  DAILY_RECURRING: "Estudar o tempo definido todos os dias, a partir da data de início.",
  TOTAL_BY_DATE: "Acumular o tempo total até a data final.",
  TOTAL_IN_PERIOD: "Acumular o tempo total dentro do período (início e fim).",
};

export const goalStatusInfo: Record<GoalProgressStatus, { label: string, color: string }> = {
  NOT_STARTED: { label: "Não iniciada", color: "grey" },
  IN_PROGRESS: { label: "Em andamento", color: "info" },
  ACHIEVED: { label: "Concluída", color: "success" },
  EXPIRED: { label: "Não atingida", color: "error" },
};
