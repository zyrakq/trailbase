import { FC } from "react";
import { InputAvatar } from "./InputAvatar";
import { CommentInputForm } from "./CommentInputForm";
import { Container } from "./styles";
import { useCommentList } from "@/components/CommentList";

export const CommentForm: FC = () => {
  const { count } = useCommentList();
  return (
    <Container style={{ marginTop: count === 0 ? 10 : 20 }}>
      <InputAvatar />
      <CommentInputForm />
    </Container>
  );
};
