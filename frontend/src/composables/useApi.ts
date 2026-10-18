import { isError } from "@/services/api/isError.typeGuard";
import type { ApiResult } from "@/services/abstract/service.abstract";
import { useNotifyStore } from "@/stores/notify.store";
import { firstErrorMessage } from "@/utils/apiErrors";

/**
 * Executa uma chamada e trata o erro com o snackbar.
 * Retorna os dados (array) ou null quando houve erro.
 */
export const useApi = () => {
  const notify = useNotifyStore();

  const run = async <T>(call: Promise<ApiResult<T>>, successMessage?: string): Promise<T[] | null> => {
    const response = await call;

    if (isError(response)) {
      notify.error(firstErrorMessage(response));
      return null;
    }

    if (successMessage) notify.success(successMessage);
    return response.data;
  };

  const runOne = async <T>(call: Promise<ApiResult<T>>, successMessage?: string): Promise<T | null> => {
    const data = await run(call, successMessage);
    return data ? (data[0] ?? null) : null;
  };

  return { run, runOne };
};
