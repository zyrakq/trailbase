import { LoadMoreRowsProps, PostResultModel } from "./types";

const get_post_list = async (
  type: string,
  sub: string,
  offset: number,
  count: number
): Promise<PostResultModel> => {
  const response = await fetch(
    `${
      import.meta.env.REACT_APP_POST_FILTER_URL
    }/${type}/posts?sub=${sub}&offset=${offset}&count=${count}`,
    {
      method: "GET",
    }
  );

  const result: PostResultModel = await response.json();

  return result;
};

export const load_more_rows = async ({
  sub,
  offset,
  limit,
  isPrivate,
}: LoadMoreRowsProps) => {
  return await get_post_list(
    isPrivate ? "private" : "public",
    sub,
    offset,
    limit
  );
};
