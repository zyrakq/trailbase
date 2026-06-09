import { FC } from "react";
import { Divider, Space } from "antd";
import { useDateFnsLocale, useTranslation } from "@/services/i18n";
import { Link, Text } from "@/ui";
import { useComment } from "@/components/CommentWidget";

export const CommentContent: FC = () => {
  const { comment } = useComment();

  const { t } = useTranslation("common");

  const { formatRelative } = useDateFnsLocale();

  return (
    <>
      <Text style={{ whiteSpace: "pre-wrap" }} color="secondary">
        {comment.text}
      </Text>
      <Divider style={{ margin: 0, borderBlockStart: "none" }} />
      <Text component="span">
        {comment.updated_at &&
          formatRelative(new Date(comment.updated_at), new Date())}
        {comment.created_at !== comment.updated_at &&
          ` (${t("comment_list.comment_changed")})`}
      </Text>
      <Space>
        <Link
          color="secondary"
          style={{ paddingLeft: "10px" }}
          onClick={() => {}}
        >
          {t("comment_list.reply")}
        </Link>
      </Space>
    </>
  );
};
