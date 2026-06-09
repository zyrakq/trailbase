import { useOidc } from "@axa-fr/react-oidc";
import { useAuthor } from "@/components/AuthorSecure";
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { PostListInfiniteLoader, PostListLoader } from "./types";
import { PostModel, usePostList } from "..";
import { getPostList } from "../fake";

export type { PostListInfiniteLoader, PostListLoader } from "./types";

export const usePostListInfiniteLoader = (): PostListInfiniteLoader => {

  const { onChange, } = usePostList();

  const { author: { sub }} = useAuthor();

  const { isAuthenticated } = useOidc();

  const { mutateAsync } = useMutation({
    mutationFn: getPostList,
   // mutationKey: ['postlist', sub],
    onSuccess: async (newData: { items: PostModel[]; total: number }) => {
      await onChange(newData);
    },
  });

  const loadMoreRows = useCallback(async ({ startIndex, stopIndex }: { startIndex: number, stopIndex: number}) => {
    const offset = startIndex;
    const limit = stopIndex - startIndex + 1;
    await mutateAsync({
      isPrivate: isAuthenticated,
      offset,
      limit,
      sub
    });
  }, [mutateAsync, sub, isAuthenticated]);

  return { loadMoreRows }
};



export const usePostListLoader = (): PostListLoader => {

  const limit = 10;

  const { count, onChange } = usePostList();

  const { author: { sub }} = useAuthor();

  const { isAuthenticated } = useOidc();

  const { mutateAsync, isSuccess } = useMutation({
    mutationFn: getPostList,
    //mutationKey: ['postlist', sub],
    onSuccess: async (newData: { items: PostModel[]; total: number }) => {
      await onChange(newData);
    },
  });

  const load = useCallback(async () => {
    const offset = count;
    await mutateAsync({
      isPrivate: isAuthenticated,
      offset,
      limit,
      sub
    });
    return { isSuccess }
  }, [mutateAsync, isSuccess, sub, isAuthenticated, limit, count]);

  return { load }
};
