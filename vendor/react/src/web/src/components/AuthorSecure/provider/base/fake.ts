
import { getRandomProfileAvatar } from "@/utils/random";
import { AuthorInfo } from "./types";
import { v4 } from 'uuid';

const init_author_info = async (username: string): Promise<AuthorInfo> => {
    const picture = await getRandomProfileAvatar();
    return {
        sub: v4(),
        username,
        picture,
        subscribed_user_count: 0,
    };
};


export const get_author_info =  (username: string): Promise<AuthorInfo> => {

    return new Promise(resolve => {
        setTimeout(async() => {
            const userStr = localStorage.getItem(`user-${username}`);
            const authorStr = localStorage.getItem(`author-${username}`);
            let author = await init_author_info(username);
            if (authorStr) {
                author = JSON.parse(authorStr);
            }
            if (userStr) {
                const user = JSON.parse(userStr);
                author = { ...author, ...user, picture: user.picture };
            }

            localStorage.setItem(`author-${username}`, JSON.stringify(author));

            resolve(author);
        }, 1000);
    });
};
