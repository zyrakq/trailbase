import {
  CommentListRequest,
  CommentListResult,
  CommentModel,
  ReplyModel,
  CommentListRefreshRequest,
} from ".";

import { v4 } from "uuid";
import { generateRandomDate, getRandomAvatar, get_text, get_words, get_random_number } from "@/utils/random";



const init_comment_replies =  async (reply_uuid: string): Promise<ReplyModel[]> => {
  let replies =  Array.from({length: get_random_number(0, 6)}, (_, _index) => {
    const created_at = generateRandomDate();
    const updated_at = get_random_number(0, 1) === 0 ? created_at : generateRandomDate(created_at);
    return {
      sub: v4(),
      uuid: v4(),
      username: get_words(),
      picture: '',
      text: get_text(1, 2, 'sentences'),
      created_at: created_at.toUTCString(),
      updated_at: updated_at.toUTCString(),
      deleted_at: undefined,
      reply_uuid,
      files: [],
    };
  });
  for (let i = 0; i < replies.length; i++) {
    replies[i].picture = await getRandomAvatar();
  }
  return replies;
}

const init_comment_items =  async(): Promise<CommentModel[]> => {
  let comments =  Array.from({length: get_random_number(10, 20)}, (_, _index) => {
    const created_at = generateRandomDate();
    const updated_at = get_random_number(0, 1) === 0 ? created_at : generateRandomDate(created_at);
    return {
      sub: v4(),
      uuid: v4(),
      username: get_words(),
      picture: '',
      text: get_text(1, 2, 'sentences'),
      replies: [] as ReplyModel[],
      files: [],
      created_at: created_at.toUTCString(),
      updated_at: updated_at.toUTCString(),
      deleted_at: undefined,
    }
  });
  for (let i = 0; i < comments.length; i++) {
    comments[i].picture = await getRandomAvatar();

    const replies = await init_comment_replies(comments[i].uuid);
    comments[i].replies = replies;
  }
  return comments;
};

const sort_comment_list = (items: CommentModel[]): CommentModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.created_at);
    const right = new Date(b.created_at);
    return left > right ? 1 : -1;
  });
};

const get_comment_items = async(uuid: string): Promise<CommentModel[]> => {

  const comments = localStorage.getItem(`comment-list[${uuid}]`);
  let result = [];
  if (comments) {
    result = JSON.parse(comments);
  }
  else {
    result = await init_comment_items();
    localStorage.setItem(`comment-list[${uuid}]`, JSON.stringify(result));
  }

  return sort_comment_list(result);
};

/************************loader and getter******************/

const get_comment_list = async (_type: string, uuid: string, offset: number, count: number): Promise<CommentListResult> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      const comments = (await get_comment_items(uuid))
        .filter(item => item.deleted_at === undefined || item.replies.length > 0);

      const list = comments
        .reverse()
        .slice(offset, offset + count)
        .reverse();

      const fullTotal = (offset == 0 ? comments : list)
        .reduce((acc, item) => acc + item.replies.length + (item.deleted_at === undefined ? 1 : 0), 0);

      let result = {
        total: comments.length,
        fullTotal,
        list,
      } as CommentListResult;

      resolve(result);
    });
  });
};

export const getCommentList = async ({ uuid, offset, limit, isPrivate }: CommentListRequest) => {
  return await get_comment_list(isPrivate ? "private" : "public", uuid, offset, limit);
};

/************************loader and getter******************/

/************************refresher******************/
export const get_refresh_comment_list = async (_type: string, uuid: string, created_at: Date): Promise<CommentListResult> => {
    return new Promise(resolve => {
      setTimeout(async() => {
        const comments = (await get_comment_items(uuid))
          .filter(item => item.deleted_at === undefined || item.replies.length > 0);

        const list = comments
          .filter(item => {
            const current = new Date(item.created_at);
            return current > created_at
          });

        const fullTotal = list
          .reduce((acc, item) => acc + item.replies.length + (item.deleted_at === undefined ? 1 : 0), 0);

        let result = {
          total: comments.length,
          fullTotal,
          list
        } as CommentListResult;

        resolve(result);
      });
    });
};

export const getRefreshCommentList = async ({ uuid, created_at, isPrivate }: CommentListRefreshRequest) => {
  console.info(created_at);
  return await get_refresh_comment_list(isPrivate ? "private" : "public", uuid, created_at);
};
/************************refresher******************/
