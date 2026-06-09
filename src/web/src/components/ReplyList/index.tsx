import { List } from "antd";
import { Link } from "@/ui";
import { useTranslation } from "@/services/i18n";
import { ReplyModel } from "@/components/CommentList";
import { ReplyWidget } from "@/components/ReplyWidget";
import { useReplyList, useReplyListLoader } from "./provider";

export { useReplyList, useReplyListLoader } from "./provider";

export type { ReplyListLoader } from "./provider";

export const ReplyList = () => {
  const { t } = useTranslation("common");

  const { list, count, total } = useReplyList();

  const { load } = useReplyListLoader();

  const rowRenderer = (reply: ReplyModel, _index: number) => {
    return <ReplyWidget key={reply.uuid} reply={reply} size="small" />;
  };

  return (
    <div style={{ width: "100%", paddingLeft: "50px" }}>
      {list.length > 0 && (
        <>
          {count < total && (
            <Link
              style={{ paddingTop: "5px" }}
              variant="dashed"
              onClick={() => load()}
            >
              {t("comment_list.show_more_replies")}
            </Link>
          )}
          <List
            style={{ paddingTop: count < total ? "10px" : "0" }}
            dataSource={list}
            renderItem={rowRenderer}
          />
        </>
      )}
    </div>
  );
};
