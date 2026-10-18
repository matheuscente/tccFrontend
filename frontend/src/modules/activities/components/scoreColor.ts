export const scoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "grey";
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "error";
};

export const formatScore = (score: number | null | undefined): string =>
  score === null || score === undefined ? "—" : `${Number(score.toFixed(1)).toLocaleString("pt-BR")}%`;
