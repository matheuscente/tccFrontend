// Descarta respostas de requisições antigas quando filtros mudam antes da resposta anterior chegar.
export const useLatest = () => {
  let current = 0;
  return {
    next: () => ++current,
    isLatest: (id: number) => id === current,
  };
};
