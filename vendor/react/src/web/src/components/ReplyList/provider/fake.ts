import { CommentModel, ReplyModel } from "@/components/CommentList";
import { ReplyListRequest, ReplyListResult } from ".";




const sort_reply_list = (items: ReplyModel[]): ReplyModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.created_at);
    const right = new Date(b.created_at);
    return left > right ? 1 : -1;
  });
};

const get_reply_items = async (source_uuid: string, uuid: string)
  : Promise<{ replies: ReplyModel[] }> => {

  const commentsJson = localStorage.getItem(`comment-list[${source_uuid}]`);

  const comments: CommentModel[] = commentsJson ? JSON.parse(commentsJson) : [];

  const comment = comments.find(x => x.uuid === uuid);

  let result: ReplyModel[] = [];

  if (comment) {
    result = comment.replies;
  }

  return {
    replies: sort_reply_list(result)
  };
};



const get_reply_list = async (_type: string, source_uuid: string, uuid: string, offset: number, count: number): Promise<ReplyListResult> => {
  return new Promise(resolve => {
    setTimeout(async () => {
      const { replies } = await get_reply_items(source_uuid, uuid);
      const comments = replies
        .filter(item => item.deleted_at === undefined);

      const list = comments.reverse().slice(offset, offset + count).reverse();

      let result = {
        total: comments.length,
        list,

      } as ReplyListResult;

      resolve(result);
    });
  });
};

export const getReplyList = async ({ uuid, offset, limit, isPrivate, additional: { source_uuid } }: ReplyListRequest) => {
  return await get_reply_list(isPrivate ? "private" : "public", source_uuid, uuid, offset, limit);
};
