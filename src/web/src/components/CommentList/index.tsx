import { List } from "antd";
import { CommentModel } from "./provider/types";
import { useCommentList, useCommentListLoader } from "./provider";
import { CommentWidget } from "@/components/CommentWidget";
import { CommentFormWidget } from "../CommentFormWidget";
import { Link } from "@/ui";
import { useTranslation } from "@/services/i18n";

export {
  CommentListProvider,
  useCommentList,
  useCommentListLoader,
  useCommentListRefresher,
} from "./provider";

export type {
  CommentModel,
  ReplyModel,
  CommentListResult,
  CommentListLoader,
  CommentListRefresher,
} from "./provider";

export const ShowMoreComments = () => {
  const { t } = useTranslation("common");

  const { load } = useCommentListLoader();

  return (
    <Link variant="dashed" style={{ paddingLeft: "5px" }} onClick={load}>
      {t("comment_list.show_more_comments")}
    </Link>
  );
};

export const CommentList = () => {
  const { list, count, total } = useCommentList();

  const rowRenderer = (comment: CommentModel, _index: number) => {
    return <CommentWidget key={comment.uuid} comment={comment} />;
  };

  return (
    <div style={{ width: "100%" }}>
      {list.length > 0 && (
        <>
          {count < total && <ShowMoreComments />}
          <List dataSource={list} renderItem={rowRenderer} />
        </>
      )}
      <CommentFormWidget />
    </div>
  );
};
