import { FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthor } from "@/components/AuthorSecure";
import { ReceivedPost, ReceivedPostProvider } from "@/components/ReceivedPost";

export const PostWidget: FC = () => {
  const { uuid } = useParams();

  const navigate = useNavigate();

  if (!uuid) navigate("/404");

  const { isSuccess } = useAuthor();

  return (
    <>
      {isSuccess && !!uuid && (
        <ReceivedPostProvider uuid={uuid}>
          <ReceivedPost />
        </ReceivedPostProvider>
      )}
    </>
  );
};
