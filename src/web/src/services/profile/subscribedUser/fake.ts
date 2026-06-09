import { SubscribedUser } from "./types";

export const get_subs =  (sub: string): Promise<SubscribedUser[]> => {

    return new Promise(resolve => {
        setTimeout(async() => {
            const subs = localStorage.getItem(`user-${sub}-subs`);
            let result = [];
            if (subs) {
                result = JSON.parse(subs);
            }
            resolve(result);
        }, 1000); 
    });
};