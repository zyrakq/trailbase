import { CommentModel, ReplyModel  } from "@/components/CommentList";
import { ReplyRefreshRequest } from ".";


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

const get_reply = async (uuid: string, source_uuid: string, list_uuid: string): Promise<ReplyModel> => {
    return new Promise((resolve, reject) => {
      setTimeout(async() => {
        const replies = await get_reply_items(source_uuid, list_uuid);

        const reply =  replies.find(x => x.uuid === uuid);

        if (reply) resolve(reply);
        else reject();
      }, 1000);
    });
};


export const getRefreshReply = async ({ uuid, additional }: ReplyRefreshRequest) => {
    return await get_reply(uuid, additional.source_uuid, additional.list_uuid);
};
