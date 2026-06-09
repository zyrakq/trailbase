import { FC, createContext, useContext, useCallback } from "react";

import { createComment } from "./fake";
import { CommentCreatorManager, CreateCommentModel } from "./types";
import { useMutation } from "@tanstack/react-query";
import { useCommentListRefresher } from "@/components/CommentList";
import { useProfile } from "@/services/profile";

export type { CommentCreatorManager } from "./types";

const useCommentCreatorManager = (uuid: string): CommentCreatorManager => {
  const { refresh } = useCommentListRefresher();

  const {
    user: { sub, username, picture },
  } = useProfile();

  const { mutateAsync, isSuccess, isPending } = useMutation({
    mutationKey: ["commentlist-creator"],
    mutationFn: createComment,
  });

  const create = useCallback(
    async (data: CreateCommentModel) => {
      const additional = { source_uuid: uuid, sub, username, picture };

      await mutateAsync({ data, additional });

      await refresh();
    },
    [uuid, refresh, mutateAsync, sub, username, picture]
  );

  return {
    isPending,
    isSuccess,
    create,
  };
};

const CommentCreatorContext = createContext<CommentCreatorManager | null>(null);

export const useCommentCreator = () => {
  const context = useContext(CommentCreatorContext);

  if (!context) {
    throw new Error(
      "useCommentCreator must be used within CommentCreatorContext"
    );
  }
  return context;
};

export const CommentCreatorProvider: FC<{
  uuid: string;
  children: React.ReactNode;
}> = ({ uuid, children }) => {
  const value = useCommentCreatorManager(uuid);

  return (
    <CommentCreatorContext.Provider value={value}>
      {children}
    </CommentCreatorContext.Provider>
  );
};
