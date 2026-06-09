import { FC, createContext, useContext, useMemo } from "react";

import { CommentListManager, CommentModel } from "./types";
import { getCommentList } from "./fake";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useProfile } from "@/services/profile";

export { useCommentListLoader } from "./loader";
export { useCommentListRefresher } from "./refresher";

export type {
  CommentModel,
  ReplyModel,
  CommentListRequest,
  CommentListRefreshRequest,
  CommentListResult,
  CommentListLoader,
  CommentListRefresher,
} from "./types";

const sortComments = (items: CommentModel[]): CommentModel[] => {
  return items.sort((a, b) => {
    const left = new Date(a.created_at);
    const right = new Date(b.created_at);
    return left > right ? 1 : -1;
  });
};

export const expand = (
  oldList: CommentModel[],
  expandList: CommentModel[],
  total: number,
  fullTotal: number
) => ({
  list: sortComments([...oldList, ...expandList]),
  total,
  fullTotal,
});

const useCommentListManager = (
  uuid: string,
  render?: () => void
): CommentListManager => {
  const startLimit = 2;

  const { isSuccess: isSuccessProfile } = useProfile();

  //const [fullTotal, setFullTotal] = useState<number>(0);

  const {
    data: { list, total, fullTotal } = {
      list: [],
      total: 0,
      fullTotal: 0,
    },
    isLoading,
    isFetching,
    isRefetching,
    isSuccess,
  } = useSuspenseQuery({
    queryKey: ["commentlist", uuid],
    queryFn: () =>
      getCommentList({
        isPrivate: isSuccessProfile,
        offset: 0,
        limit: startLimit,
        uuid,
      }),
    refetchOnMount: false,
  });

  // useEffect(() => {
  //   if (fullTotal === 0 && list.length !== 0) setFullTotal(initialFullTotal);
  // }, [initialFullTotal, fullTotal, setFullTotal]);

  // const addToFullTotal = useCallback(
  //   (inc: number) => {
  //     setFullTotal((prev) => prev + inc);
  //   },
  //   [setFullTotal]
  // );

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
    fullTotal,
    render,
  };
};

const CommentListContext = createContext<CommentListManager | null>(null);

export const useCommentList = () => {
  const context = useContext(CommentListContext);

  if (!context) {
    throw new Error("useCommentList must be used within CommentListContext");
  }
  return context;
};

export const CommentListProvider: FC<{
  uuid: string;
  render?: () => void;
  children: React.ReactNode;
}> = ({ uuid, render, children }) => {
  const value = useCommentListManager(uuid, render);

  return (
    <CommentListContext.Provider value={value}>
      {children}
    </CommentListContext.Provider>
  );
};
