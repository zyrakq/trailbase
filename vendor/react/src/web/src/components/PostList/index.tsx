import { VirtualizedList } from "./components/VirtualizedList";
import { EmptyPlaceholder } from "./components/EmptyPlaceholder";
import { PostListRowRender } from "./components/PostListRowRender";

import { SpinContainer } from "./styles";
import { usePostList, usePostListLoader, usePostListRender } from "./provider";
import { Button, Spinner } from "@/ui";
import { useMemo } from "react";
import { t } from "i18next";

export {
  usePostList,
  usePostListInfiniteLoader,
  usePostListLoader,
  usePostListRender,
} from "./provider";
export type {
  PostListManager,
  PostListInfiniteLoader,
  PostListLoader,
  PostListRenderManager,
  PostModel,
} from "./provider";

export const PostList = () => {
  const { ref, cache } = usePostListRender();

  const { isLoading, isFetching, list, count, total } = usePostList();

  const { load } = usePostListLoader();

  const isUpload = useMemo(() => count < total, [count, total]);

  return (
    <>
      {!isFetching && (
        <EmptyPlaceholder condition={count > 0}>
          <VirtualizedList
            cache={cache}
            data={list}
            dataRef={ref}
            overscanRowCount={10}
            rowHeight={cache.current.rowHeight}
            rowRenderer={PostListRowRender()}
          />
        </EmptyPlaceholder>
      )}
      {isLoading && (
        <SpinContainer>
          <Spinner fontSize={80} style={{ alignSelf: "center" }} />
        </SpinContainer>
      )}
      {!isLoading && isUpload && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={() => load()}>{t("actions.load_more")}</Button>
        </div>
      )}
    </>
  );
};
