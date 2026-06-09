import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/services/profile";
import { ReplyModel } from "@/components/CommentList";
import { ReplyListResult, expand, useReplyList } from ".";
import { getReplyList } from "./fake";
import { ReplyListLoader } from "./types";


export const useReplyListLoader = (): ReplyListLoader  => {

  const limit = 20;

  const queryClient = useQueryClient();

  const { uuid, list, render, additional: { source_uuid } } = useReplyList();

  const { isSuccess: isSuccessProfile } = useProfile();

  const { mutateAsync, isSuccess } = useMutation({
    mutationFn: async({ oldList, expandList, total }: {
      oldList: ReplyModel[],
      expandList: ReplyModel[],
      total: number,
    }) => {
      return expand(oldList, expandList, total);
    },
    mutationKey: ["replylist-loader", uuid],
    onSuccess: (newData: ReplyListResult) => {
      queryClient.setQueryData(["replylist", uuid], newData);
      if(render) render();
    },
  });

  const load = useCallback(async () => {

    const offset = list.filter((x) => x.deleted_at === undefined).length;

    const { list: expandList, total } = await getReplyList({
      isPrivate: isSuccessProfile, offset, limit, uuid, additional: { source_uuid }
    });

    await mutateAsync({
      oldList: list,
      expandList,
      total,
    });

  }, [queryClient, mutateAsync, source_uuid, isSuccessProfile, list, uuid, limit]);

  return { isSuccess, load }
};
