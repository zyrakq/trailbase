import { UserInfo } from "./types";
import { v4 } from 'uuid';

export const init_user_info =  async (user: UserInfo): Promise<UserInfo> => {

    return {
        sub: user.sub ?? v4(),
        username: user.username,
        is_author: user.is_author ?? true,
        picture: user.picture,
        currency: user.currency
    };
};

export const get_user_info =  (user: UserInfo): Promise<UserInfo> => {
    return new Promise(resolve => {
        setTimeout(async () => {

            const userStr = localStorage.getItem(`user-${user.username}`);
            const authorStr = localStorage.getItem(`author-${user.username}`);

            let result = await init_user_info(user);
            if (userStr) {
                result = JSON.parse(userStr);
            }
            if (authorStr){
                const author = JSON.parse(authorStr);
                result = { ...author, ...result, picture: result.picture };
            }

            localStorage.setItem(`user-${user.username}`, JSON.stringify(result));

            resolve(result);
        }, 1000); 
    });
};