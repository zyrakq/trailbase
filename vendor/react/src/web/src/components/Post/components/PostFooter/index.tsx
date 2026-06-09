import { useNavigate } from "react-router-dom";
import { Comment } from "@styled-icons/fluentui-system-regular";
import {
  ControlPaper,
  PostButton,
  PostFooterWrapper,
  PostFooterContentWrapper,
} from "./styles";
import { usePost } from "@/components/Post";
import { CommentList, useCommentList } from "@/components/CommentList";
import { useAuthor } from "@/components/AuthorSecure";

export const PostFooter = () => {
  const navigate = useNavigate();

  const {
    author: { username },
  } = useAuthor();

  const {
    data: { uuid },
  } = usePost();

  const { fullTotal } = useCommentList();

  const openPost = (username: string, uuid: string) => {
    navigate(`/${username}/posts/${uuid}`);
  };

  return (
    <PostFooterWrapper>
      <PostFooterContentWrapper>
        <ControlPaper>
          <PostButton
            style={{ paddingLeft: 0 }}
            onClick={() => openPost(username, uuid)}
          >
            <Comment fontWeight={900} size={26} />
            {fullTotal}
          </PostButton>
        </ControlPaper>
      </PostFooterContentWrapper>
      <CommentList />
    </PostFooterWrapper>
  );
};
