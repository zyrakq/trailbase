
import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Currency, useCurrencyList } from "@/services/currencyList";
import { useProfile } from "@/services/profile";

import { chooseUserCurrency, getCurrencyByLanguage } from "./fake";
import { UserCurrencyChooserManager } from "./types";
import { useTranslation } from "@/services/i18n";
import { useOidc } from "@axa-fr/react-oidc";

export type { UserCurrencyChooserManager } from './types';


export const useUserCurrencyChooser = (): UserCurrencyChooserManager => {

    const { isAuthenticated } = useOidc();
    const {
        user: { sub, username, currency },
        isSuccess: isSuccessProfile,
        refresh: refreshProfile
    } = useProfile();

    const { i18n } = useTranslation();

    const { list } = useCurrencyList();

    const getDefaultCurrency = useCallback(async () => {
        if(list && i18n && i18n.language){
            return await getCurrencyByLanguage(list, i18n.language);
        }

    }, [list, i18n]);

    const getProfileCurrency = useCallback(async () => {

        let result = list.find(x => x.symbol === currency);
        if(!result) {
            result = await getDefaultCurrency();
            if(!!result) await chooseUserCurrency(result, username)
        }
        return result;

    }, [username, list, currency, getDefaultCurrency]);

    const getUserCurrency = useCallback(async () => {
        const result = isSuccessProfile ? await getProfileCurrency() : await getDefaultCurrency();
        return result;
    }, [isSuccessProfile, getProfileCurrency, getDefaultCurrency]);

    const {
        data: userCurrency = {} as Currency,
        refetch,
        isLoading,
        isFetching: isFetchingUserCurrency
    } = useQuery({
        queryKey: ['user-currency', sub],
        queryFn: getUserCurrency,
        enabled: ((isAuthenticated && isSuccessProfile) || !isAuthenticated),
        refetchOnMount: false
    });

    const { mutateAsync, isPending: isShoosing } = useMutation({
        mutationFn: async (currency: Currency) => await chooseUserCurrency(currency, username),
        // { mutationKey: ['user-currency', sub] }
    });

    const chooseCurrency = useCallback(async (currency: Currency) => {

        await mutateAsync(currency);

        await refreshProfile();

        await refetch();

    }, [mutateAsync, refreshProfile, refetch]);

    const isFetching = useMemo(
        () => isFetchingUserCurrency || isShoosing,
        [isFetchingUserCurrency, isShoosing]
      );


    return {
        isLoading,
        isFetching,
        userCurrency,
        chooseCurrency
    }
}
