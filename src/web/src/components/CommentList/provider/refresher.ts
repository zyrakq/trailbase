import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentListRefresher } from "./types";
import { CommentListResult, CommentModel, expand, useCommentList, useCommentListLoader } from ".";
import { getRefreshCommentList } from "./fake";
import { useProfile } from "@/services/profile";

export const useCommentListRefresher = (): CommentListRefresher => {

  const queryClient = useQueryClient();

  const { uuid, list, fullTotal, render } = useCommentList();

  const { load, isSuccess: isSuccessLoader} = useCommentListLoader();

  const { isSuccess: isSuccessProfile } = useProfile();

  const { mutateAsync, isSuccess: isSuccessRefresh } = useMutation({
    mutationFn: async({ oldList, expandList, total, fullTotal }: {
      oldList: CommentModel[],
      expandList: CommentModel[],
      total: number,
      fullTotal: number
    }) => {
      return expand(oldList, expandList, total, fullTotal);
    },
    mutationKey: ["commentlist-refresher", uuid],
    onSuccess: async (newData: CommentListResult) => {
      queryClient.setQueryData(["commentlist", uuid], newData);
      if(render) render();
    },
  });


  const lastItemCreatedAt = useMemo(
    () => list
      .map(x => new Date(x.created_at))
      .reduce(
        (max, current) => !!max && max > current ? max : current,
        undefined as Date|undefined
      ),
    [list]
  );

  const isListExists = useMemo(
    () => !!lastItemCreatedAt,
    [lastItemCreatedAt]
  );

  const isSuccess = useMemo(
    () => isListExists && isSuccessRefresh || !isListExists && isSuccessLoader,
    [isListExists, isSuccessRefresh, isSuccessLoader]
  );

  const refresh = useCallback(async () => {

    if (isListExists) {
      const { list: expandList, total } = await getRefreshCommentList({
        isPrivate: isSuccessProfile,
        created_at: lastItemCreatedAt!,
        uuid
      });

      await mutateAsync({
        oldList: list,
        expandList,
        total,
        fullTotal: fullTotal + expandList.length
      });
    }
    else
      await load();

  }, [mutateAsync, list, fullTotal, isSuccessProfile, lastItemCreatedAt, isListExists, uuid, load]);

  return { isSuccess, refresh }
};
