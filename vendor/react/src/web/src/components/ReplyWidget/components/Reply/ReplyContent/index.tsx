import { FC } from "react";
import { Divider, Space } from "antd";
import { useDateFnsLocale, useTranslation } from "@/services/i18n";
import { Link, Text } from "@/ui";
import { useReply } from "@/components/ReplyWidget";

export const ReplyContent: FC = () => {
  const { reply } = useReply();

  const { t } = useTranslation("common");

  const { formatRelative } = useDateFnsLocale();

  return (
    <>
      <Text style={{ whiteSpace: "pre-wrap" }} color="secondary">
        {reply.text}
      </Text>
      <Divider style={{ margin: 0, borderBlockStart: "none" }} />
      <Text component="span">
        {reply.updated_at &&
          formatRelative(new Date(reply.updated_at), new Date())}
        {reply.created_at !== reply.updated_at &&
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
