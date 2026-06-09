import { UserInfo } from "@/services/profile";
import { ResponseStatus } from "./types";

export const get_user_info =  (username: string): Promise<UserInfo | undefined> => {
  return new Promise(resolve => {
      setTimeout(() => {
          const userInfo = localStorage.getItem(`user-${username}`);
          let result = undefined;
          if (userInfo) {
              result = JSON.parse(userInfo);
          }
          resolve(result);
      }, 1000);
  });
};

export const become_author = async (username: string): Promise<{ status: ResponseStatus }> => {
  return new Promise(resolve => {
      setTimeout(async() => {
        let result = { status: ResponseStatus.LoadingError };

        const user = await get_user_info(username);
        if(user) {
          user.is_author = true;

          localStorage.setItem(`user-${username}`, JSON.stringify(user));

          result = { status: ResponseStatus.Accepted };
        }
        resolve(result);

      }, 1000);
  });
};
