


export const delete_comment = async (uuid: string): Promise<void> => {
  const response = await fetch(`${import.meta.env.REACT_APP_COMMENT_COMMANDER_URL}/comments/${uuid}`, {
      method: "DELETE",
  });


  if (!response.ok) {
    throw Error('Error sending a request to delete a comment');
  }
};
