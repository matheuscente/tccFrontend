const GAP = 60_000;

// posição usada para ordenar: a manual, quando existe, ou o instante de inclusão
export const orderOf = (item: { position: number | null, createdAt: string }) => item.position ?? Date.parse(item.createdAt);

// posições para inserir `count` itens entre dois vizinhos (qualquer um deles pode não existir)
export const positionsBetween = (before: number | null, after: number | null, count = 1): number[] => {
  const start = before ?? (after !== null ? after - GAP * (count + 1) : Date.now());
  const end = after ?? Math.max(start + GAP * (count + 1), Date.now());
  return Array.from({ length: count }, (_, index) => start + ((end - start) * (index + 1)) / (count + 1));
};
