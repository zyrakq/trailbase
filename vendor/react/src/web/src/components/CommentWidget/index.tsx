import { FC } from "react";
import { CommentProvider } from "./provider";
import { Comment } from "./components/Comment";
import { CommentModel } from "../CommentList";

export { useComment, useCommentEditor, useCommentRemover } from "./provider";
export type { CommentEditorManager, CommentRemoverManager } from "./provider";

export type CommentWidgetProps = {
  comment: CommentModel;
  size?: "small" | "large";
};

export const CommentWidget: FC<CommentWidgetProps> = ({
  comment,
  size = "large",
}) => {
  return (
    <CommentProvider comment={comment}>
      <Comment size={size} />
    </CommentProvider>
  );
};
