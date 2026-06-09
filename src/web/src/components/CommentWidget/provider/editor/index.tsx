import { useCallback } from "react";
import { editComment } from "./fake";
import { CommentEditorManager, EditCommentModel } from "./types";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useComment } from "..";

export type { CommentEditorManager } from "./types";

export const useCommentEditor = (): CommentEditorManager => {
  const {
    uuid,
    refresh,
    additional: { list_uuid },
  } = useComment();

  const {
    mutateAsync,
    isSuccess,
    isPending: isLoading,
  } = useMutation({
    mutationKey: ["comment-editor", uuid],
    mutationFn: editComment,
    onSuccess: async () => await refresh(0),
  });

  const edit = useCallback(
    async (data: EditCommentModel) => {
      const additional = {
        list_uuid,
        updated_at: format(Date.now(), "yyyy-MM-dd HH:mm:ss"),
      };
      await mutateAsync({ uuid, data, additional });
    },
    [uuid, list_uuid, mutateAsync]
  );

  return {
    isLoading,
    isSuccess,
    edit,
  };
};
