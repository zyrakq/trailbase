import { ReplyListManager } from "./types";
import { getReplyList } from "./fake";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useProfile } from "@/services/profile";
import { useComment } from "@/components/CommentWidget";
import { ReplyModel } from "@/components/CommentList";
import { useMemo } from "react";

export { useReplyListLoader } from "./loader";

export type {
  ReplyListLoader,
  ReplyListRequest,
  ReplyListResult,
} from "./types";

const sortReplies = (items: ReplyModel[]): ReplyModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.created_at);
    const right = new Date(b.created_at);
    return left > right ? 1 : -1;
  });
};

export const expand = (
  oldList: ReplyModel[],
  expandList: ReplyModel[],
  total: number
) => ({
  list: sortReplies([...oldList, ...expandList]),
  total,
});

export const useReplyList = (): ReplyListManager => {
  const startLimit = 2;

  const {
    comment: { uuid },
    render,
    //addToFullTotal,
    additional: { list_uuid: source_uuid },
  } = useComment();

  const { isSuccess: isSuccessProfile } = useProfile();

  const {
    data: { list, total } = {
      list: [],
      total: 0,
    },
    isLoading,
    isFetching,
    isRefetching,
    isSuccess,
  } = useSuspenseQuery({
    queryKey: ["replylist", uuid],
    queryFn: () =>
      getReplyList({
        isPrivate: isSuccessProfile,
        offset: 0,
        limit: startLimit,
        additional: { source_uuid },
        uuid,
      }),
    refetchOnMount: false,
  });

  const count = useMemo(() => Object.keys(list).length, [list]);

  return {
    uuid,

    isLoading,
    isFetching,
    isRefetching,
    isSuccess,

    list,
    count,
    total,

    render,

    additional: { source_uuid },
  };
};
