import { PostModel } from "@/components/PostList";
import { AdditionalInfo, LoadingStatus, PostResult } from "./types";

const getSubscriptions = async (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
};

const hasAccess = async (
  model: PostModel,
  subscriptions: string[]
): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = subscriptions.some((x) =>
        model.subscription_types.includes(x)
      );
      switch (model.access_type) {
        case "public":
          resolve(true);
          break;
        case "subscription":
          resolve(result);
          break;
        case "one-time":
          resolve(false);
          break;
        default:
          resolve(result);
          break;
      }
    }, 100);
  });
};

const get_post_access = async (
  items: PostModel[]
  /* author_sub: string,
  current_user_sub: string */
): Promise<PostModel[]> => {
  const subscriptions = await getSubscriptions();

  const tasks = items.map(async (x) => ({
    ...x,
    access: await hasAccess(x, subscriptions),
  }));

  return Promise.all(tasks);
};

const get_post_items = async (sub: string): Promise<PostModel[]> => {
  const posts = localStorage.getItem(`post-list[${sub}]`);
  let result = [];
  if (posts) {
    result = JSON.parse(posts);
  }

  return result;
};

export const get_post = async (
  _type: string,
  uuid: string,
  additional: AdditionalInfo
): Promise<PostResult> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      let result = { post: {} as PostModel, status: LoadingStatus.NotFound };

      let posts = await get_post_items(additional.sub);

      posts = await get_post_access(posts /* additional.sub, "" */);

      const post = posts.find((x) => x.uuid === uuid);

      if (post) {
        result = { post, status: LoadingStatus.Loaded };
      }

      resolve(result);
    }, 1000);
  });
};
