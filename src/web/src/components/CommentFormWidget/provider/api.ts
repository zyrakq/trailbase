import { CreateCommentModel } from "./types";


export const create_comment = async (data: CreateCommentModel): Promise<{ uuid: string }> => {
    const response = await fetch(`${import.meta.env.REACT_APP_COMMENT_COMMANDER_URL}/comments`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({...data, text: JSON.stringify(data.text)}),
    });


    if (!response.ok) {
        throw Error('Error sending request with edited comment');
    }

    return { uuid: await response.text() };
};
