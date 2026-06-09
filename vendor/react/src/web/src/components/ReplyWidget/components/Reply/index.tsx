import { FC, useState } from "react";
import { CommentItem, CommentItemMeta } from "./styles";
import { RightMenu } from "./RightMenu";
import { useEditor } from "./editor";
import { useRemover } from "./remover";
import { CheckmarkStarburst } from "@styled-icons/fluentui-system-filled";
import { UserAvatar } from "@/components/UserAvatar";
import { DeletedPlaceholder } from "./DeletedPlaceholder";
import { TextAreaEditor } from "./TextAreaEditor";
import { ReplyContent } from "./ReplyContent";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useReply } from "../..";

export { useEditor } from "./editor";
export { useRemover } from "./remover";

export type ReplyProps = {
  size?: "small" | "large";
};

export const Reply: FC<ReplyProps> = ({ size = "large" }) => {
  const { reply, isAuthor } = useReply();

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
            sub={reply.sub}
            visibility={actionsVisibility}
            onEdit={open}
            onDelete={remove}
          />,
        ];

  return (
    <CommentItem
      style={{
        flex: "auto",
        borderBottom: "none",
        paddingBottom: 0,
        paddingTop: 0,
      }}
      actions={actions}
      onMouseEnter={() => setActionsVisibility(true)}
      onMouseLeave={() => setActionsVisibility(false)}
    >
      <CommentItemMeta
        avatar={
          <div style={{ marginTop: 10 }}>
            <UserAvatar
              shape="circle"
              size={size === "large" ? 40 : 30}
              picture={reply.picture}
              username={reply.username}
              isLoading={false}
            />
          </div>
        }
        title={
          <>
            {reply.username}
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
                <ReplyContent />
              </TextAreaEditor>
            </DeletedPlaceholder>
          </EmptyPlaceholder>
        }
      />
    </CommentItem>
  );
};
