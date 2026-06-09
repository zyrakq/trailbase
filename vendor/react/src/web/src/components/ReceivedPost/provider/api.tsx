import { PostModel } from "@/components/PostList";
import { LoadingStatus, PostResult } from "./types";

export const get_post = async (
  type: string,
  uuid: string
): Promise<PostResult> => {
  const response = await fetch(
    `${import.meta.env.REACT_APP_POST_REQUESTER_URL}/${type}/posts/${uuid}`,
    {
      method: "GET",
    }
  );

  let post: PostModel = {} as PostModel;
  let status = LoadingStatus.LoadingError;

  if (response.ok) {
    post = await response.json();
    status = LoadingStatus.Loaded;
  }

  if (response.status === 404) status = LoadingStatus.NotFound;

  return { post, status };
};
