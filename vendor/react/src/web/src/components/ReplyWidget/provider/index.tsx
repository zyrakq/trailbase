import { FC, createContext, useCallback, useContext, useMemo } from "react";
import { useReplyList } from "@/components/ReplyList";
import { useQueryClient } from "@tanstack/react-query";
import { getRefreshReply } from "./fake";
import { useAuthor } from "@/components/AuthorSecure";
import { ReplyModel } from "@/components/CommentList";

export { useReplyEditor } from "./editor";
export { useReplyRemover } from "./remover";

export type { ReplyEditorManager } from "./editor";
export type { ReplyRemoverManager } from "./remover";

export type { ReplyRefreshRequest } from "./types";

export interface ReplyManager {
  uuid: string;
  reply: ReplyModel;
  isAuthor: boolean;
  refresh: (total: number) => Promise<void>;
  render?: () => void;
  additional: {
    source_uuid: string;
    list_uuid: string;
  };
}

export const useReplyManager = (reply: ReplyModel): ReplyManager => {
  const queryClient = useQueryClient();

  const {
    uuid: list_uuid,
    list,
    total,
    render,
    additional: { source_uuid },
  } = useReplyList();

  const uuid = useMemo(() => reply.uuid, [reply]);

  const {
    author: { sub },
  } = useAuthor();

  const isAuthor = useMemo(() => reply.sub === sub, [sub, reply]);

  const refresh = useCallback(
    async (num: number) => {
      const newReply = await getRefreshReply({
        uuid: reply.uuid,
        additional: { source_uuid, list_uuid },
      });

      const newList = list.map((item) =>
        item.uuid === newReply.uuid ? newReply : item
      );

      queryClient.setQueryData(["replylist", list_uuid], {
        list: newList,
        total: total + num,
      });

      if (render) render();
    },
    [list, total, reply, source_uuid, list_uuid, render]
  );

  return {
    uuid,
    reply,
    isAuthor,
    refresh,
    render,
    additional: {
      source_uuid,
      list_uuid,
    },
  };
};

const ReplyContext = createContext<ReplyManager | null>(null);

export const useReply = () => {
  const context = useContext(ReplyContext);

  if (!context) {
    throw new Error("useReply must be used within ReplyContext");
  }
  return context;
};

export const ReplyProvider: FC<{
  reply: ReplyModel;
  children: React.ReactNode;
}> = ({ reply, children }) => {
  const value = useReplyManager(reply);

  return (
    <ReplyContext.Provider value={value}>{children}</ReplyContext.Provider>
  );
};
