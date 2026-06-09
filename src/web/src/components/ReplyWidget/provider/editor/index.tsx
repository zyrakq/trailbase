import { useCallback } from "react";
import { editReply } from "./fake";
import { ReplyEditorManager, EditReplyModel } from "./types";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useReply } from "..";

export type { ReplyEditorManager } from "./types";

export const useReplyEditor = (): ReplyEditorManager => {
  const {
    uuid,
    refresh,
    additional: { source_uuid, list_uuid },
  } = useReply();

  const {
    mutateAsync,
    isSuccess,
    isPending: isLoading,
  } = useMutation({
    mutationKey: ["reply-editor", uuid],
    mutationFn: editReply,
    onSuccess: async () => await refresh(0),
  });

  const edit = useCallback(
    async (data: EditReplyModel) => {
      const additional = {
        source_uuid,
        list_uuid,
        updated_at: format(Date.now(), "yyyy-MM-dd HH:mm:ss"),
      };
      await mutateAsync({ uuid, data, additional });
    },
    [uuid, source_uuid, list_uuid, mutateAsync]
  );

  return {
    isLoading,
    isSuccess,
    edit,
  };
};
