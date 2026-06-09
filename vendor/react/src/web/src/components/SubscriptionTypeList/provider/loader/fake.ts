import { LoadingStatus, SubscriptionTypeModel, SubscriptionTypeResult } from "./types";

import { v4 } from "uuid";
import { getRandomSubTypeImage, get_text, get_words, get_random_number } from "@/utils/random";


const init_subscription_type_items =  async(): Promise<SubscriptionTypeModel[]> => {
  let subscriptionTypes =  Array.from({length: get_random_number(2, 6)}, (_, _index) => {
    return {
      uuid: v4(),
      title: get_words(),
      amount: 200,
      picture: '',
      description: get_text(1, 3, 'sentences'),
    }
  });
  for (let i = 0; i < subscriptionTypes.length; i++) {
    subscriptionTypes[i].picture = await getRandomSubTypeImage();
  }
  return subscriptionTypes;
};

export const get_subscription_type_items = async(sub: string): Promise<SubscriptionTypeModel[]> => {

  const subscriptionTypes = localStorage.getItem(`subscription-type-list[${sub}]`);
  let result = [];
  if (subscriptionTypes) {
    result = JSON.parse(subscriptionTypes);
  }
  else {
    result = await init_subscription_type_items();
    localStorage.setItem(`subscription-type-list[${sub}]`, JSON.stringify(result));
  }

  return result;
};



export const get_subscription_type_list = async (_type: string, sub: string, /* additional: AdditionalInfo */): Promise<SubscriptionTypeResult> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      const subscriptionTypes = await get_subscription_type_items(sub);

      resolve({ list: subscriptionTypes, status: LoadingStatus.Loaded });
    });
  });
};
