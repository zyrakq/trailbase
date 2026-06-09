import { FC } from "react";
import { CommentCreatorProvider } from "./provider";
import { useCommentList } from "@/components/CommentList";
import { CommentForm } from "./components/CommentForm";

export { useCommentCreator } from "./provider";
export type { CommentCreatorManager } from "./provider";

export type CommentWidgetProps = {
  post_uuid: string;
};

export const CommentFormWidget: FC = () => {
  const { uuid } = useCommentList();

  return (
    <CommentCreatorProvider uuid={uuid}>
      <CommentForm />
    </CommentCreatorProvider>
  );
};
