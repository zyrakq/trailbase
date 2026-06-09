import { v4 } from 'uuid';
import { AdditionalInfo, CreateCommentModel } from './types';
import { CommentModel } from "@/components/CommentList";
import { format } from 'date-fns';


const get_comment_items = async(source_uuid: string): Promise<CommentModel[]> => {

  const comments = localStorage.getItem(`comment-list[${source_uuid}]`);
  let result = [];
  if (comments) {
    result = JSON.parse(comments);
  }

  return result;
};

const create_comment = async (data: CreateCommentModel, additional: AdditionalInfo): Promise<{ uuid: string }> => {
  return new Promise(resolve => {
      setTimeout(async() => {
        const model = {
          uuid: v4(),
          text: data.text,
          files: data.files,
          replies: [],
          replies_count: 0,
          created_at: format(Date.now(), 'yyyy-MM-dd HH:mm:ss'),
          updated_at: format(Date.now(), 'yyyy-MM-dd HH:mm:ss'),
          deleted_at: undefined,
          sub: additional.sub,
          username: additional.username,
          picture: undefined//additional.picture
        } as CommentModel;

        const comments = await get_comment_items(additional.source_uuid);
        comments.push(model);

        localStorage.setItem(`comment-list[${additional.source_uuid}]`, JSON.stringify(comments));

        resolve({ uuid: model.uuid });
      }, 1000);
  });
};

export const createComment = async ({ data, additional }:{ data: CreateCommentModel, additional: AdditionalInfo }) => {
  return await create_comment(data, additional);
};
