import { FC, createContext, useCallback, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import { useUserCurrencyChooser } from "@/services/profile";

import { getRate } from "./fake";
import { RateManager } from "./types";

export type { RateManager } from "./types";

const useRateManager = (): RateManager => {
  const { userCurrency, isFetching: isFetchingUserCurrency } =
    useUserCurrencyChooser();

  const {
    data = { id: userCurrency.id, rate: 1 },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["user-currency-rate", userCurrency.id],
    queryFn: async () => await getRate(userCurrency.id),
    enabled: !isFetchingUserCurrency && !!userCurrency.id,
  });

  const getAmount = useCallback((amount: number) => amount * data.rate, [data]);

  return {
    isLoading,
    isFetching,
    rate: data.rate,
    getAmount,
  };
};

const RateContext = createContext<RateManager | null>(null);

export const useRate = () => {
  const context = useContext(RateContext);

  if (!context) {
    throw new Error("useRate must be used within RateContext");
  }
  return context;
};

export const RateProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useRateManager();

  return <RateContext.Provider value={value}>{children}</RateContext.Provider>;
};
