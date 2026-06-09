import { FC } from "react";
import { ReplyProvider } from "./provider";
import { Reply } from "./components/Reply";
import { ReplyModel } from "@/components/CommentList";

export { useReply, useReplyEditor, useReplyRemover } from "./provider";
export type { ReplyEditorManager, ReplyRemoverManager } from "./provider";

export type ReplyWidgetProps = {
  reply: ReplyModel;
  size?: "small" | "large";
};

export const ReplyWidget: FC<ReplyWidgetProps> = ({
  reply,
  size = "large",
}) => {
  return (
    <ReplyProvider reply={reply}>
      <Reply size={size} />
    </ReplyProvider>
  );
};
