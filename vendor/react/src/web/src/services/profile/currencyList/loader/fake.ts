import { Currency } from "@/services/currencyList";

export const getUserCurrencies =  (sub: string): Promise<Currency[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const currencies = localStorage.getItem(`user-currencies-${sub}`);
            let result: Currency[] = [];
            if (currencies) {
                result = JSON.parse(currencies);
            }
            else {
                localStorage.setItem(`user-currencies-${sub}`, JSON.stringify(result));
            }
            resolve(result);
        }, 1000);
    });
};
