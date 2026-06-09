import { AdditionalInfo } from './types';
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


const delete_reply = async (uuid: string, additional: AdditionalInfo): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let replies = await get_reply_items(additional.source_uuid, additional.list_uuid);

      replies = replies.map(item => (item.uuid === uuid ? { ...item, deleted_at: additional.deleted_at } : item));

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

      localStorage.setItem(`comment-list[${additional.list_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};


const restore_reply = async (uuid: string, additional: AdditionalInfo): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let replies = await get_reply_items(additional.source_uuid, additional.list_uuid);

      replies = replies.map(item => (item.uuid === uuid ? { ...item, deleted_at: undefined } : item));

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

      localStorage.setItem(`comment-list[${additional.list_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};
export const deleteReply = async ({ uuid, additional }:{ uuid: string, additional: AdditionalInfo }) => {
  return await delete_reply(uuid, additional);
};

export const restoreReply = async ({ uuid, additional }:{ uuid: string, additional: AdditionalInfo }) => {
  return await restore_reply(uuid, additional);
};
