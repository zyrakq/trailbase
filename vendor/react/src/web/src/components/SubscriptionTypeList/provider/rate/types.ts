export interface CurrencyRate {
    id: string;
    rate: number;
}
  
export interface RateManager {
    isLoading: boolean;
    isFetching: boolean;
    rate: number;
    getAmount: (amount: number) => number;
}