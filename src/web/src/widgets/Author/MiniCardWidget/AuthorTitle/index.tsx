import { FC } from "react";
import { useAuthor } from "@/components/AuthorSecure";
import { Text } from "@/ui";
import { Row } from "antd";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export const AuthorTitle: FC = () => {
  const { author, isLoading } = useAuthor();

  return (
    <Row
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
      }}
    >
      <EmptyPlaceholder condition={!isLoading}>
        <Text style={{ fontSize: 16 }} color="secondary">
          {author.username}
        </Text>
      </EmptyPlaceholder>
    </Row>
  );
};
