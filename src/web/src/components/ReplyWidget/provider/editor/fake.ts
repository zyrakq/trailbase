import { AdditionalInfo, EditReplyModel } from './types';
import { CommentModel, ReplyModel  } from "@/components/CommentList";


const sort_reply_list = (items: ReplyModel[]): ReplyModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.created_at);
    const right = new Date(b.created_at);
    return left > right ? 1 : -1;
  });
};

const get_reply_items = async(source_uuid: string, list_uuid: string): Promise<ReplyModel[]> => {

  const commentsJson = localStorage.getItem(`comment-list[${source_uuid}]`);

  const comments: CommentModel[] = commentsJson ? JSON.parse(commentsJson) : [];

  const comment = comments.find(x => x.uuid === list_uuid);

  let result: ReplyModel[] = [];

  if (comment) {
    result = comment.replies;
  }

  return sort_reply_list(result);
};


const edit_reply = async (
  uuid: string,
  data: EditReplyModel,
  additional: AdditionalInfo
): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let replies = await get_reply_items(additional.source_uuid, additional.list_uuid);

      replies = replies.map(item => {
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

      const commentsJson = localStorage.getItem(`comment-list[${additional.source_uuid}]`);

      let comments: CommentModel[] = commentsJson ? JSON.parse(commentsJson) : [];

      comments = comments.map(item => {
        if(item.uuid === uuid) {
          return {
            ...item,
            replies
          };
        }
        return item;
      });

      localStorage.setItem(`comment-list[${additional.source_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};

export const editReply = async ({ uuid, data, additional }:{ uuid: string, data: EditReplyModel, additional: AdditionalInfo }) => {
  return await edit_reply(uuid, data, additional);
};
