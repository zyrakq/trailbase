import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/services/profile";
import { CommentListLoader, CommentListResult, CommentModel, expand, useCommentList } from ".";
import { getCommentList } from "./fake";


export const useCommentListLoader = (): CommentListLoader  => {

  const limit = 20;

  const queryClient = useQueryClient();

  const { uuid, list, fullTotal, render } = useCommentList();

  const { isSuccess: isSuccessProfile } = useProfile();

  const { mutateAsync, isSuccess } = useMutation({
    mutationFn: async({ oldList, expandList, total, fullTotal }: {
      oldList: CommentModel[],
      expandList: CommentModel[],
      total: number,
      fullTotal: number
      }) => {
      return expand(oldList, expandList, total, fullTotal);
    },
    mutationKey: ["commentlist-loader", uuid],
    onSuccess: async (newData: CommentListResult) => {
      queryClient.setQueryData(["commentlist", uuid], newData);
      if(render) render();
    },
  });

  const load = useCallback(async () => {

    const offset = list.filter((x) => x.deleted_at === undefined).length;

    const { list: expandList, total } = await getCommentList({ isPrivate: isSuccessProfile, offset, limit, uuid });

    await mutateAsync({
      oldList: list,
      expandList,
      total,
      fullTotal
    });

  }, [queryClient, mutateAsync, isSuccessProfile, list, fullTotal, uuid, limit]);

  return { isSuccess, load }
};
