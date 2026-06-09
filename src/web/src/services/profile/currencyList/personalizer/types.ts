import { Currency } from "@/services/currencyList";

export interface UserCurrencyListPersonalizerManager {
    isLoading: boolean;
    addCurrency: (currency: Currency) => Promise<void>;
    removeCurrency: (currency: Currency) => Promise<void>;
}
