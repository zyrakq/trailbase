import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrencyList } from "@/services/currencyList";
import { useProfile } from "@/services/profile";
import { getUserCurrencies } from "./fake";
import { UserCurrencyListLoaderManager } from "./types";

export type { UserCurrencyListLoaderManager } from "./types";

export const useUserCurrencyListLoader = (): UserCurrencyListLoaderManager => {
  const {
    user: { sub },
  } = useProfile();

  const { list, isSuccess } = useCurrencyList();

  const {
    data: userCurrencies = [],
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["user-currencies", sub],
    queryFn: async () => await getUserCurrencies(sub),
    enabled: isSuccess,
    refetchOnMount: false,
  });

  const currencies = useMemo(
    () => list.filter((x) => !userCurrencies.map((u) => u.id).includes(x.id)),
    [list, userCurrencies]
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    isFetching,
    isLoading,
    userCurrencies: userCurrencies,
    currencies: currencies,
    refresh,
  };
};
