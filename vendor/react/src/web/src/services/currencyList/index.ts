
import { getCurrencies } from "./fake";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CurrencyListManager } from "./types";


export type { Currency, CurrencyListManager } from './types';


export const useCurrencyList = (): CurrencyListManager => {

    const {
        data: list = [],
        isFetching,
        isSuccess
    } = useSuspenseQuery({
        queryKey: ['currencies'],
        queryFn: async() => await getCurrencies(),
        refetchOnMount: false
    });

    return {
        isFetching,
        isSuccess,
        list
    }
}
