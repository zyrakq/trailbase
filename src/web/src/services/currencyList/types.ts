export interface Currency {
    id: string;
    name: string;
    symbol: string;
}


export interface CurrencyListManager {
    isFetching: boolean;
    isSuccess: boolean;
    list: Currency[];
}