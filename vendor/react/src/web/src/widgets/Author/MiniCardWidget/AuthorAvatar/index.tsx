import { FC } from "react";
import { useAuthor } from "@/components/AuthorSecure";
import { UserAvatar } from "@/components/UserAvatar";
import { Row } from "antd";

export const AuthorAvatar: FC = () => {
  const { author, isLoading } = useAuthor();

  return (
    <Row
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
      }}
    >
      <UserAvatar
        shape="circle"
        size={100}
        picture={author.picture}
        username={author.username}
        isLoading={isLoading}
        preview={true}
      />
    </Row>
  );
};
