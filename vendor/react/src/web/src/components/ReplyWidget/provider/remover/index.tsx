import { useCallback, useMemo } from "react";

import { deleteReply, restoreReply } from "./fake";
import { ReplyRemoverManager } from "./types";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useReply } from "..";

export type { ReplyRemoverManager } from "./types";

export const useReplyRemover = (): ReplyRemoverManager => {
  const {
    uuid,
    refresh,
    additional: { source_uuid, list_uuid },
  } = useReply();

  const {
    mutateAsync: deleteAsync,
    isSuccess: isDeleted,
    isPending: isDeleting,
  } = useMutation({
    mutationKey: ["reply-remover", uuid],
    mutationFn: deleteReply,
    onSuccess: async () => await refresh(-1),
  });

  const {
    mutateAsync: restoreAsync,
    isSuccess: isRestored,
    isPending: isRestoring,
  } = useMutation({
    mutationKey: ["reply-restorer", uuid],
    mutationFn: restoreReply,
    onSuccess: async () => await refresh(1),
  });

  const isLoading = useMemo(
    () => isDeleting || isRestoring,
    [isDeleting, isRestoring]
  );

  const remove = useCallback(async () => {
    const additional = {
      source_uuid,
      list_uuid,
      deleted_at: format(Date.now(), "yyyy-MM-dd HH:mm:ss"),
    };
    await deleteAsync({ uuid, additional });
  }, [uuid, source_uuid, list_uuid, deleteAsync]);

  const restore = useCallback(async () => {
    const additional = { source_uuid, list_uuid };
    await restoreAsync({ uuid, additional });
  }, [uuid, source_uuid, list_uuid, restoreAsync]);

  return {
    isLoading,
    isDeleted,
    isRestored,
    remove,
    restore,
  };
};
