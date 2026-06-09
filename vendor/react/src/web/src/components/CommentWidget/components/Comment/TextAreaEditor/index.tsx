import { FC } from "react";
import { Space } from "antd";
import { useTranslation } from "@/services/i18n";
import { ConfirmFormButtonBar } from "@/components/ConfirmFormButtonBar";
import { TextArea } from "@/ui";
import { TextAreaEditorProps } from "./types";
import { useComment } from "@/components/CommentWidget";

export const TextAreaEditor: FC<TextAreaEditorProps> = ({
  condition,
  text,
  onChange,
  onClose,
  onSubmit,
  children,
}) => {
  const { render } = useComment();

  const { t } = useTranslation("common");

  return (
    <>
      {condition ? (
        children
      ) : (
        <>
          <TextArea
            style={{ paddingRight: 60 }}
            rows={1}
            autoSize={true}
            onResize={() => {
              if (render) render();
            }}
            placeholder={t("comment_list.leave_comment")}
            value={text}
            onChange={(e) => onChange(e.target.value)}
          />
          <Space align="end" style={{ paddingTop: 10 }}>
            <ConfirmFormButtonBar
              reverse
              handleCancel={() => onClose()}
              handleSubmit={async () => await onSubmit()}
              submitText={t("actions.save")}
            />
          </Space>
        </>
      )}
    </>
  );
};
