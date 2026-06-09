import { UserInfo } from '@/services/profile';

export const save_avatar = async (blob: Blob, username: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {

        const userStr = localStorage.getItem(`user-${username}`);

        if (!userStr) return reject();

        const user: UserInfo = JSON.parse(userStr);

        const reader = new FileReader();
        reader.onload = async() => {
            const base64Text = reader.result as string;

            user.picture = base64Text;
            // Сохраняем строку Base64 в localStorage
            localStorage.setItem(`user-${username}`, JSON.stringify(user));

            resolve();

        };
        reader.readAsDataURL(blob);
    }, 1000);
  });
};

export const delete_avatar = async (username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {

            const userStr = localStorage.getItem(`user-${username}`);

            if (!userStr) return reject();

            const user: UserInfo = JSON.parse(userStr);

            localStorage.setItem(`user-${username}`, JSON.stringify({ ...user, picture: undefined }));

            resolve();

        }, 1000);
    });
  };
