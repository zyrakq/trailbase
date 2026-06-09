import { AdditionalInfo } from './types';
import { CommentModel  } from "@/components/CommentList";


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


const delete_comment = async (uuid: string, additional: AdditionalInfo): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let comments = await get_comment_items(additional.list_uuid);

      comments = comments.map(item => (item.uuid === uuid ? {...item, deleted_at: additional.deleted_at }: item));

      localStorage.setItem(`comment-list[${additional.list_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};


const restore_comment = async (uuid: string, additional: AdditionalInfo): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let comments = await get_comment_items(additional.list_uuid);

      comments = comments.map(item => (item.uuid === uuid ? {...item, deleted_at: undefined }: item));

      localStorage.setItem(`comment-list[${additional.list_uuid}]`, JSON.stringify(comments));

      resolve();
    }, 1000);
  });
};


export const getComment = async ({ uuid, post_uuid }:{ uuid: string, post_uuid: string }) => {
    return await get_comment(uuid, post_uuid);
};

export const deleteComment = async ({ uuid, additional }:{ uuid: string, additional: AdditionalInfo }) => {
  return await delete_comment(uuid, additional);
};

export const restoreComment = async ({ uuid, additional }:{ uuid: string, additional: AdditionalInfo }) => {
  return await restore_comment(uuid, additional);
};
