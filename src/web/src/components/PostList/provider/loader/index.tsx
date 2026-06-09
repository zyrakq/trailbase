import { PostListManager, PostModel } from "./types";
import {
  FC,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getPostList } from "./fake";
import { useOidc } from "@axa-fr/react-oidc";

export { usePostListInfiniteLoader, usePostListLoader } from "./hooks";
export type { PostListInfiniteLoader, PostListLoader } from "./hooks";
export type { PostListManager, PostModel } from "./types";

export const usePostListManager = (sub: string) => {
  const authorSub = useMemo(() => sub, [sub]);

  const [_list, setList] = useState<PostModel[]>([]);

  const [total, setTotal] = useState<number>(0);

  const { isAuthenticated } = useOidc();

  const onChange = useCallback(
    async (newData: { items: PostModel[]; total: number }) => {
      setList([..._list, ...newData.items]);
      setTotal(newData.total);
    },
    [_list, setTotal, setList]
  );

  const {
    data: { items: list } = { list: [] },
    isLoading,
    isSuccess,
    isFetching,
    isRefetching,
  } = useSuspenseQuery({
    queryKey: ["postlist", authorSub],
    queryFn: async () =>
      await getPostList({
        isPrivate: isAuthenticated,
        offset: 0,
        limit: 5,
        sub: authorSub,
      }),
    // select: async (newData: { items: PostModel[]; total: number }) => {
    //   //await onChange(newData);
    //   return newData;
    // },
  });

  const count = useMemo(() => Object.keys(list!).length, [list]);

  return {
    isLoading,
    isFetching,
    isRefetching,
    isSuccess,

    list: list!,
    count,
    total,
    onChange,
  };
};

const BasePostListContext = createContext<PostListManager>({
  isLoading: false as boolean,
  isFetching: false as boolean,
  isRefetching: false as boolean,
  isSuccess: false as boolean,

  list: {} as PostModel[],
  count: {} as number,
  total: {} as number,
  onChange: {} as (newData: {
    items: PostModel[];
    total: number;
  }) => Promise<void>,
});

export const usePostList = () => {
  const context = useContext(BasePostListContext);

  if (!context) {
    throw new Error("usePostList must be used within BasePostListContext");
  }
  return context;
};

export const BasePostListProvider: FC<{
  sub: string;
  children: React.ReactNode;
}> = ({ sub, children }) => {
  const value = usePostListManager(sub);

  return (
    <BasePostListContext.Provider value={value}>
      {children}
    </BasePostListContext.Provider>
  );
};
