import { FC } from "react";
import { Form } from "antd";
import { Send } from "@styled-icons/material-outlined";
import { InputContainer, IconSendButton } from "./styles";
import { useTranslation } from "@/services/i18n";
import { Link, Text, TextArea } from "@/ui";
import { useAvatar, useProfile } from "@/services/profile";
import { useCreator } from "./hook";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export const CommentInputForm: FC = () => {
  const { t } = useTranslation("common");

  const { text, onChange, submit, render } = useCreator();

  const { isSuccess } = useProfile();

  const { isLoading } = useAvatar();

  return (
    <div style={{ flexGrow: 1, marginBottom: isLoading ? 18 : -12 }}>
      <EmptyPlaceholder condition={!isLoading}>
        {isSuccess && (
          <Form style={{ flexGrow: 1 }}>
            <Form.Item>
              <InputContainer>
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
                <IconSendButton onClick={submit}>
                  <Send size={26} />
                </IconSendButton>
              </InputContainer>
            </Form.Item>
          </Form>
        )}
        {!isSuccess && (
          <Text
            style={{
              whiteSpace: "pre-wrap",
              padding: "10px 0 0 15px",
              marginBottom: 38,
            }}
            color="secondary"
          >
            <Link variant="dashed" onClick={() => {}}>
              {t("profile.login")}
            </Link>
            {t("comment_list.to_post_comments")}
          </Text>
        )}
      </EmptyPlaceholder>
    </div>
  );
};
