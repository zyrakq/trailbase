import { CommentModel  } from "@/components/CommentList";
import { CommentRefreshRequest } from ".";


const get_comment_items = async(list_uuid: string): Promise<CommentModel[]> => {

  const comments = localStorage.getItem(`comment-list[${list_uuid}]`);
  let result = [];
  if (comments) {
    result = JSON.parse(comments);
  }

  return result;
};

const get_comment = async (uuid: string, list_uuid: string): Promise<CommentModel> => {
    return new Promise((resolve, reject) => {
      setTimeout(async() => {
        const comments = await get_comment_items(list_uuid);

        const comment =  comments.find(x => x.uuid === uuid);

        if (comment) resolve(comment);
        else reject();
      }, 1000);
    });
};


export const getRefreshComment = async ({ uuid, additional }: CommentRefreshRequest) => {
    return await get_comment(uuid, additional.list_uuid);
};
