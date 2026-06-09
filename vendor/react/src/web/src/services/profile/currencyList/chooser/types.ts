import { Currency } from "@/services/currencyList";

export interface UserCurrencyChooserManager {
    isLoading: boolean;
    isFetching: boolean;
    userCurrency: Currency;
    chooseCurrency: (currency: Currency) => Promise<void>
}
