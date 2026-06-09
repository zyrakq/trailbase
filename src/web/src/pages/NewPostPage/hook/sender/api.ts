import { DescendantDraft } from "@/pages/NewPostPage";




export const createPost = async ({ data }: { data: DescendantDraft }): Promise<{ uuid: string }> => {
    const response = await fetch(`${import.meta.env.REACT_APP_POST_COMMANDER_URL}/posts`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({...data, text: JSON.stringify(data.text)}),
    });

    if (!response.ok) {
        throw Error('Error submitting post changes');
    }
    const uuid = await response.text();

    return { uuid };
};
