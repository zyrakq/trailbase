import { Currency } from "@/services/currencyList";
import { UserInfo } from "@/services/profile";


export const chooseUserCurrency = async (currency: Currency, username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {

        const userStr = localStorage.getItem(`user-${username}`);

        if (!userStr) return reject();

        const user: UserInfo = JSON.parse(userStr);

        user.currency = currency.id;

        localStorage.setItem(`user-${username}`, JSON.stringify(user));

        resolve();
      }, 1000);
    });
  };


export const getCurrencyByLanguage = async (currencies: Currency[], language: string | undefined): Promise<Currency> => {
    return new Promise(resolve => {
      setTimeout(async() => {

        switch (language) {
          case 'ru':
            resolve(currencies.find(x => x.symbol === 'RUB')!);
            break;
          case 'en':
            resolve(currencies.find(x => x.symbol === 'USD')!);
            break;
          case 'tr':
            resolve(currencies.find(x => x.symbol === 'TRY')!);
            break;
          case 'zh':
            resolve(currencies.find(x => x.symbol === 'CNY')!);
            break;
          default:
            resolve(currencies.find(x => x.symbol === 'mBTC')!);
            break;
        }
      });
    });
};
