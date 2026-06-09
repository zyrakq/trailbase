import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { Currency } from "@/services/currencyList";
import { useProfile } from "@/services/profile";

import { addUserCurrency, removeUserCurrency } from "./fake";
import { UserCurrencyListPersonalizerManager } from "./types";
import { useUserCurrencyListLoader } from "../loader";


export type { UserCurrencyListPersonalizerManager } from './types';

export const useUserCurrencyListPersonalizer = (): UserCurrencyListPersonalizerManager => {
    const { user: { sub } } = useProfile();

    const { isFetching: isFetchingLoader, refresh: refreshLoader } = useUserCurrencyListLoader();

    const {
        mutateAsync: addCurrencyAsync,
        isPending: isLoadingAddCurrency,
    } = useMutation({
        mutationFn: async (currency: Currency) => await addUserCurrency(currency, sub),
        //{ mutationKey: ['user-currencies', sub] }
    });

    const addCurrency = useCallback(async (currency: Currency) => {

        await addCurrencyAsync(currency);

        await refreshLoader();

    }, [addCurrencyAsync, refreshLoader]);


    const {
        mutateAsync: removeCurrencyAsync,
        isPending: isLoadingRemoveCurrency,
    } = useMutation({
        mutationFn: async (currency: Currency) => await removeUserCurrency(currency, sub),
        //{ mutationKey: ['user-currencies', sub] }
    });

    const removeCurrency = useCallback(async (currency: Currency) => {

        await removeCurrencyAsync(currency);

        await refreshLoader();

    }, [removeCurrencyAsync, refreshLoader]);

    const isLoading = useMemo(
        () => isFetchingLoader || isLoadingAddCurrency || isLoadingRemoveCurrency,
        [isFetchingLoader, isLoadingAddCurrency, isLoadingRemoveCurrency]
      );

    return {
        isLoading,
        addCurrency,
        removeCurrency,
    }
}
