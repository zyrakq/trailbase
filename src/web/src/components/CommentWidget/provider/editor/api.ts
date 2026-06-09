import { EditCommentModel } from "./types";


export const edit_comment = async (uuid: string, data: EditCommentModel): Promise<void> => {
  const response = await fetch(`${import.meta.env.REACT_APP_COMMENT_COMMANDER_URL}/comments/${uuid}`, {
      method: "PUT",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({...data, text: JSON.stringify(data.text)}),
  });

  if (!response.ok) {
      throw Error('Error sending request with edited comment');
  }
};
