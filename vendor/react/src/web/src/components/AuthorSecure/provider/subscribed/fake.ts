import { get_subs } from "@/services/profile/subscribedUser/fake";
import { AddSubscribedUser, DelSubscribedUser } from "./types";
import { get_author_info } from "../base/fake";


const set_author_info = (username: string, num: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            const author = await get_author_info(username);

            localStorage.setItem(
                `author-${author.username}`,
                JSON.stringify({...author, subscribed_user_count: author.subscribed_user_count + num })
            );

            resolve();
        }, 1000);
    });
};

export const add_subscribed_user = (data: AddSubscribedUser): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            if(data.additional) {
                await set_author_info(data.additional.subscribed_user.username, 1);

                const subscribed_users = await get_subs(data.additional.sub);
                subscribed_users.push(data.additional.subscribed_user);

                localStorage.setItem(`user-${data.additional.sub}-subs`, JSON.stringify(subscribed_users));
            }
            resolve();
        }, 1000);
    });
};

export const delete_subscribed_user = (data: DelSubscribedUser): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
            if(data.additional) {
                await set_author_info(data.additional.subscribed_user.username, -1);

                let subscribed_users = await get_subs(data.additional.sub);
                subscribed_users = subscribed_users.filter(item => item.username !== data.additional?.subscribed_user.username);
                localStorage.setItem(`user-${data.additional.sub}-subs`, JSON.stringify(subscribed_users));
            }
            resolve();
        }, 1000);
    });
};
