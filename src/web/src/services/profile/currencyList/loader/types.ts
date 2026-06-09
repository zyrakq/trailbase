import { Currency } from "@/services/currencyList";


export interface UserCurrencyListLoaderManager {
    isFetching: boolean;
    isLoading: boolean;
    userCurrencies: Currency[];
    currencies: Currency[];
    refresh: () => Promise<void>
}
