import { FC, createContext, useCallback, useContext, useMemo } from "react";
import { CommentModel, useCommentList } from "@/components/CommentList";
import { useQueryClient } from "@tanstack/react-query";
import { getRefreshComment } from "./fake";
import { useAuthor } from "@/components/AuthorSecure";

export { useCommentEditor } from "./editor";
export { useCommentRemover } from "./remover";

export type { CommentEditorManager } from "./editor";
export type { CommentRemoverManager } from "./remover";

export type { CommentRefreshRequest } from "./types";

export interface CommentManager {
  uuid: string;
  comment: CommentModel;
  isAuthor: boolean;
  refresh: (num: number) => Promise<void>;
  addToFullTotal: (num: number) => Promise<void>;
  render?: () => void;
  additional: {
    list_uuid: string;
  };
}

export const useCommentManager = (comment: CommentModel): CommentManager => {
  const queryClient = useQueryClient();

  const { uuid: list_uuid, list, total, fullTotal, render } = useCommentList();

  const uuid = useMemo(() => comment.uuid, [comment]);

  const {
    author: { sub },
  } = useAuthor();

  const isAuthor = useMemo(() => comment.sub === sub, [sub, comment]);

  const refresh = useCallback(
    async (num: number) => {
      const newComment = await getRefreshComment({
        uuid: comment.uuid,
        additional: { list_uuid },
      });

      const newList = list.map((item) =>
        item.uuid === newComment.uuid ? newComment : item
      );

      queryClient.setQueryData(["commentlist", list_uuid], {
        list: newList,
        total: total + num,
        fullTotal: fullTotal + num,
      });

      if (render) render();
    },
    [list, total, fullTotal, comment, list_uuid, render]
  );

  const addToFullTotal = useCallback(
    async (num: number) => {
      queryClient.setQueryData(["commentlist", list_uuid], {
        list,
        total: total + num,
        fullTotal: fullTotal + num,
      });
    },
    [list, total, fullTotal, list_uuid]
  );

  return {
    uuid,
    comment,
    isAuthor,
    refresh,
    addToFullTotal,
    render,
    additional: {
      list_uuid,
    },
  };
};

const CommentContext = createContext<CommentManager | null>(null);

export const useComment = () => {
  const context = useContext(CommentContext);

  if (!context) {
    throw new Error("useComment must be used within CommentContext");
  }
  return context;
};

export const CommentProvider: FC<{
  comment: CommentModel;
  children: React.ReactNode;
}> = ({ comment, children }) => {
  const value = useCommentManager(comment);

  return (
    <CommentContext.Provider value={value}>{children}</CommentContext.Provider>
  );
};
