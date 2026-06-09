import { v4 } from "uuid";
import { Currency } from "./types";


const init_currency_items =  async(): Promise<Currency[]> => {
    return [
        {
            id: v4(),
            name: 'Bitcoin',
            symbol: 'mBTC'
        },
        {
            id: v4(),
            name: 'Bitcoin',
            symbol: 'BTC'
        },
        {
            id: v4(),
            name: 'Russian Ruble',
            symbol: 'RUB'
        },
        {
            id: v4(),
            name: 'US Dollar',
            symbol: 'USD'
        },
        {
            id: v4(),
            name: 'Chinese Yuan',
            symbol: 'CNY'
        },
        {
            id: v4(),
            name: 'Turkish Lira',
            symbol: 'TRY'
        },
    ];
};

export const getCurrencies =  async (): Promise<Currency[]> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            const currencies = localStorage.getItem(`currencies`);
            let result: Currency[] = await init_currency_items();
            if (currencies) {
                result = JSON.parse(currencies);
            }
            else {
                localStorage.setItem(`currencies`, JSON.stringify(result));
            }
            resolve(result);
        }, 1000); 
    });
};