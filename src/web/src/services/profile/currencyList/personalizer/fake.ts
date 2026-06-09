import { Currency } from "@/services/currencyList";
import { getUserCurrencies } from "../loader/fake";

export const addUserCurrency =  (currency: Currency, sub: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            const currencies = await getUserCurrencies(sub);
            currencies.push(currency);
            localStorage.setItem(`user-currencies-${sub}`, JSON.stringify(currencies));
            resolve();
        }, 1000);
    });
};

export const removeUserCurrency =  (currency: Currency, sub: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            const currencies = await getUserCurrencies(sub);
            localStorage.setItem(`user-currencies-${sub}`, JSON.stringify(currencies.filter(x => x.id !== currency.id)));
            resolve();
        }, 1000);
    });
};
