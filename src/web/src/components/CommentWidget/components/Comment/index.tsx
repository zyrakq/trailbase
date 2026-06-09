import { FC, useState } from "react";
import { CommentItem, CommentItemMeta } from "./styles";
import { RightMenu } from "./RightMenu";
import { useEditor } from "./editor";
import { useRemover } from "./remover";
import { CheckmarkStarburst } from "@styled-icons/fluentui-system-filled";
import { UserAvatar } from "@/components/UserAvatar";
import { ReplyList } from "@/components/ReplyList";
import { useComment } from "../../provider";
import { DeletedPlaceholder } from "./DeletedPlaceholder";
import { TextAreaEditor } from "./TextAreaEditor";
import { CommentContent } from "./CommentContent";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export { useEditor } from "./editor";
export { useRemover } from "./remover";

export type CommentProps = {
  size?: "small" | "large";
};

export const Comment: FC<CommentProps> = ({ size = "large" }) => {
  const { comment, isAuthor } = useComment();

  const {
    isLoading: isLoadingEditor,
    isOpened: isEditing,
    text,
    onChange,
    close,
    open,
    submit,
  } = useEditor();

  const {
    isLoading: isLoadingRemover,
    isDeleted,
    isRecoverable,
    remove,
    restore,
  } = useRemover();

  const [actionsVisibility, setActionsVisibility] = useState<boolean>(false);

  const actions =
    isEditing || isDeleted || isLoadingRemover || isLoadingEditor
      ? undefined
      : [
          <RightMenu
            sub={comment.sub}
            visibility={actionsVisibility}
            onEdit={open}
            onDelete={remove}
          />,
        ];

  return (
    <>
      <CommentItem
        style={{ flex: "auto", borderBottom: "none" }}
        actions={actions}
        onMouseEnter={() => setActionsVisibility(true)}
        onMouseLeave={() => setActionsVisibility(false)}
      >
        <CommentItemMeta
          avatar={
            <div style={{ marginTop: 10 }}>
              <UserAvatar
                shape="circle"
                size={size === "large" ? 40 : 25}
                picture={comment.picture}
                username={comment.username}
                isLoading={false}
              />
            </div>
          }
          title={
            <>
              {comment.username}
              {isAuthor && (
                <CheckmarkStarburst style={{ marginLeft: 5 }} size={20} />
              )}
            </>
          }
          description={
            <EmptyPlaceholder condition={!isLoadingRemover && !isLoadingEditor}>
              <DeletedPlaceholder
                condition={!isDeleted}
                isRecoverable={isRecoverable}
                onRestore={() => restore()}
              >
                <TextAreaEditor
                  condition={!isEditing}
                  text={text}
                  onChange={onChange}
                  onClose={close}
                  onSubmit={submit}
                >
                  <CommentContent />
                </TextAreaEditor>
              </DeletedPlaceholder>
            </EmptyPlaceholder>
          }
        />
      </CommentItem>
      {comment.replies.length > 0 && <ReplyList />}
    </>
  );
};
