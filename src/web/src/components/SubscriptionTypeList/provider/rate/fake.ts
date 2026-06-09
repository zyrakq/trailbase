import { getCurrencies } from "@/services/currencyList/fake";
import { CurrencyRate } from "./types";

const get_rate =  async(symbol: string): Promise<number> => {
  return new Promise(resolve => {
    setTimeout(async() => {
        switch (symbol) {
          case 'mBTC':
            resolve(1000);
          break;
          case 'BTC':
            resolve(1);
            break;
          case 'RUB':
            resolve(2102005);
            break;
          case 'USD':
            resolve(24940);
            break;
          case 'CNY':
            resolve(178483);
            break;
          default:
            resolve(590402);
            break;
        }
    }, 100);
  });
};


const init_rate_items =  async(): Promise<CurrencyRate[]> => {
  const currencies = await getCurrencies();

  let rates = [];
  for (let index = 0; index < currencies.length; index++) {
    const element = currencies[index];
    const rate = {
      id: element.id,
      rate: await get_rate(element.symbol)
    }
    rates.push(rate);

  }

  return rates;
};

const get_rate_items = async(): Promise<CurrencyRate[]> => {

  const subscriptionTypes = localStorage.getItem(`rates`);
  let result = [];
  if (subscriptionTypes) {
    result = JSON.parse(subscriptionTypes);
  }
  else {
    result = await init_rate_items();
    localStorage.setItem(`rates`, JSON.stringify(result));
  }

  return result;
};

export const getRate = async (currencyId: string): Promise<CurrencyRate> => {
  return new Promise((resolve, reject) => {
    setTimeout(async() => {

      const rates = await get_rate_items();

      let result = rates.find(x => x.id === currencyId);

      if(!result) {
        reject(new Error('Failed to set the rate for the default currency'));
      }

      resolve(result!);
    });
  });
};
