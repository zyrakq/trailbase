import { useDateFnsLocale } from "@/services/i18n";

import { PostHeaderWrapper, StyledColleagueListItemRoot } from "./styles";
import { Col, Row } from "antd";
import { Text } from "@/ui";
import { usePost } from "@/components/Post";
import { AccessPopover } from "./AccessPopover";

export const PostHeader = () => {
  const { formatRelative } = useDateFnsLocale();

  const {
    data: { published_at },
  } = usePost();

  return (
    <PostHeaderWrapper>
      <Row justify="space-between" style={{ width: "100%" }}>
        <Col>
          <AccessPopover />
        </Col>
        <Col style={{ maxWidth: "calc(100% - 32px)" }}>
          <StyledColleagueListItemRoot>
            <Text component="span">
              {published_at &&
                formatRelative(new Date(published_at), new Date())}
            </Text>
          </StyledColleagueListItemRoot>
        </Col>
      </Row>
    </PostHeaderWrapper>
  );
};
