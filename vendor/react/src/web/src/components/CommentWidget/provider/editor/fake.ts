import { AdditionalInfo, EditCommentModel } from './types';
import { CommentModel  } from "@/components/CommentList";


const get_comment_items = async(list_uuid: string): Promise<CommentModel[]> => {

  const comments = localStorage.getItem(`comment-list[${list_uuid}]`);
  let result = [];
  if (comments) {
    result = JSON.parse(comments);
  }

  return result;
};


const edit_comment = async (
  uuid: string,
  data: EditCommentModel,
  additional: AdditionalInfo
): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let comments = await get_comment_items(additional.list_uuid);

      comments = comments.map(item => {
        if(item.uuid === uuid) {
          const files = item.files.filter(it => !data.remove_files.includes(it));
          return {
            ...item,
            ...data,
            updated_at: additional.updated_at,
            files: [...files, ...data.add_files]
          };
        }
        return item;
      });

      localStorage.setItem(`comment-list[${additional.list_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};

export const editComment = async ({ uuid, data, additional }:{ uuid: string, data: EditCommentModel, additional: AdditionalInfo }) => {
  return await edit_comment(uuid, data, additional);
};
