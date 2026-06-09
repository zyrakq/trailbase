import { v4 } from "uuid";
import { LoadMoreRowsProps, PostModel, PostResultModel } from "./types";
import { generateRandomDate, getRandomTeaser, get_formatted_text, get_random_number, get_text } from "@/utils/random";
import { get_subscription_type_items } from "@/components/SubscriptionTypeList/provider/loader/fake";
import { SubscriptionTypeModel } from "@/components/SubscriptionTypeList";


const randomAccessType =  async (): Promise<'public' | 'subscription' | 'one-time' | 'one-time_or_subscription'> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      switch (get_random_number(0, 3)) {
        case 0:
          resolve('public'); break;
        case 1:
          resolve('subscription'); break;
        case 2:
          resolve('one-time'); break;
        default:
          resolve('one-time_or_subscription'); break;
      }
    }, 100);
  });

};

const getSubscriptionTypes =  async (access_type: string, subscription_items: SubscriptionTypeModel[]): Promise<string[]> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let subscription_types: SubscriptionTypeModel[] = [];
      if (access_type === 'subscription' || access_type === 'one-time_or_subscription')
      {
        subscription_types.push(subscription_items[get_random_number(0, subscription_items.length - 1)]);
      }
      resolve(subscription_types.map(x => x.uuid));
    }, 100);
  });
};


const init_post_items =  async (sub: string): Promise<PostModel[]> => {
  const teaser = await getRandomTeaser();
  const subscription_items = await get_subscription_type_items(sub);
  return await Promise.all(Array.from({length: 40}, async(_, _index) => {
    let access_type = await randomAccessType();
    if (subscription_items.length === 0 && access_type !== 'one-time') access_type = 'public';

    let subscription_types = await getSubscriptionTypes(access_type, subscription_items);
    return ({
        uuid: v4(),
        text: JSON.stringify(get_formatted_text(3, 7)),
        teaser: get_text(3, 6, 'sentences'),
        preview: teaser,
        files: [],
        access: (Math.random() >= 0.5),
        access_type,
        subscription_types,
        published_at: generateRandomDate().toUTCString()
      });
  }));
};

const get_post_items =  async (sub: string): Promise<PostModel[]> => {

  const posts = localStorage.getItem(`post-list[${sub}]`);
  let result = [];
  if (posts) {
    result = JSON.parse(posts);
  }
  else {
    result = await init_post_items(sub);
    localStorage.setItem(`post-list[${sub}]`, JSON.stringify(result));
  }

  return result;
};

const getSubscriptions =  async (): Promise<string[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
};

const hasAccess =  async (model: PostModel, subscriptions: string[]): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const result = subscriptions.some(x => model.subscription_types.includes(x))
      switch (model.access_type) {
        case 'public':
          resolve(true); break;
        case 'subscription':
          resolve(result); break;
        case 'one-time':
          resolve(false); break;
        default:
          resolve(result); break;
      }
    }, 100);
  });
};

const get_post_access =  async (items: PostModel[], /* author_sub: string, current_user_sub: string */): Promise<PostModel[]> => {

  const subscriptions = await getSubscriptions();

  const tasks = items.map(async (x) => ({ ...x, access: await hasAccess(x, subscriptions) }));

  return Promise.all(tasks);
};

const sort_post_list = (items: PostModel[]): PostModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.published_at);
    const right = new Date(b.published_at);
    return left < right ? 1 : -1;
  });
};

const get_post_list = async (_type: string, author_sub: string, offset: number, count: number): Promise<PostResultModel> => {
    return new Promise(resolve => {
      setTimeout(async() => {
        let posts = await get_post_items(author_sub);

        posts = await get_post_access(posts, /* author_sub, "" */);

        posts = sort_post_list(posts);

        const items = posts.slice(offset, offset + count);

        let result = {
            total: posts.length,
            items,
            count,
            offset

        } as PostResultModel;

        console.info(`offset: ${offset}, count: ${count}, total: ${posts.length}`);

        resolve(result);

      }, 1000);
    });
};

export const getPostList = async ({ sub, offset, limit, isPrivate }: LoadMoreRowsProps) => {
  return await get_post_list(isPrivate ? "private": "public", sub, offset, limit);
};
