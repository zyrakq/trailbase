import { useCallback, useMemo } from "react";

import { deleteComment, restoreComment } from "./fake";
import { AdditionalInfo, CommentRemoverManager } from "./types";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useComment } from "..";

export type { CommentRemoverManager } from "./types";

export const useCommentRemover = (): CommentRemoverManager => {
  const {
    uuid,
    render,
    refresh,
    additional: { list_uuid },
  } = useComment();

  const {
    mutateAsync: deleteAsync,
    isSuccess: isDeleted,
    isPending: isDeleting,
  } = useMutation({
    mutationKey: ["comment-remover", uuid],
    mutationFn: async (request: {
      uuid: string;
      additional: AdditionalInfo;
    }) => {
      if (render) render();
      deleteComment(request);
    },
    onSuccess: async () => await refresh(-1),
  });

  const {
    mutateAsync: restoreAsync,
    isSuccess: isRestored,
    isPending: isRestoring,
  } = useMutation({
    mutationKey: ["comment-restorer", uuid],
    mutationFn: async (request: {
      uuid: string;
      additional: AdditionalInfo;
    }) => {
      if (render) render();
      restoreComment(request);
    },
    onSuccess: async () => await refresh(1),
  });

  const isLoading = useMemo(
    () => isDeleting || isRestoring,
    [isDeleting, isRestoring]
  );

  const remove = useCallback(async () => {
    const additional = {
      list_uuid,
      deleted_at: format(Date.now(), "yyyy-MM-dd HH:mm:ss"),
    };
    await deleteAsync({ uuid, additional });
  }, [uuid, list_uuid, deleteAsync]);

  const restore = useCallback(async () => {
    const additional = { list_uuid };
    await restoreAsync({ uuid, additional });
  }, [uuid, list_uuid, restoreAsync]);

  return {
    isLoading,
    isDeleted,
    isRestored,
    remove,
    restore,
  };
};
