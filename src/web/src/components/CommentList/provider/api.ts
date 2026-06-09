import {CommentResultModel } from "./types";


const get_comment_list = async (
  type: string,
  post_uuid: string,
  offset: number,
  count: number
  ): Promise<CommentResultModel> => {
  const response = await fetch(`${import.meta.env.REACT_APP_COMMENT_FILTER_URL}/${type}/comments?post_uuid=${post_uuid}&offset=${offset}&count=${count}`, {
      method: "GET",
  });

  const result: CommentResultModel = await response.json();

  return result;
};

export const get_public_comment_list = async (post_uuid: string, offset: number, count: number): Promise<CommentResultModel> => {
  return get_comment_list('public', post_uuid, offset, count);
};

export const get_private_comment_list = async (post_uuid: string, offset: number, count: number): Promise<CommentResultModel> => {
  return get_comment_list('private', post_uuid, offset, count);
};
