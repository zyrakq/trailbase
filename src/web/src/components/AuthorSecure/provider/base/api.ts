import { AuthorInfo } from "./types";

export const get_author_info = async (username: string): Promise<AuthorInfo> => {
    const response = await fetch(`${import.meta.env.REACT_APP_AUTHOR_SWITCHER_URL}/profile/${username}`,
    {
        method: "GET",
    });
    if (!response.ok) {
        // Если ответ содержит код ошибки, вызываем ошибку
        throw new Error('Ошибка при выполнении запроса');
    }
    const result: AuthorInfo = await response.json();

    return result;
};
