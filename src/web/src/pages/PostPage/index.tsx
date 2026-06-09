import { FC } from "react";

import { Col, Row } from "antd";
import { PostWidget } from "@/widgets/Author/PostWidget";
import { LeftCard } from "./LeftCard";
import { RightCard } from "./RightCard";
import { SubscriptionTypeListWidget } from "@/widgets/Author/SubscriptionTypeListWidget";

export const PostPage: FC = () => {
  return (
    <SubscriptionTypeListWidget>
      <Row
        gutter={[16, 16]}
        style={{ width: "100%", padding: "24px 16px" }}
        wrap={false}
      >
        <Col flex="323px">
          <LeftCard />
        </Col>
        <Col flex="646px">
          <PostWidget />
        </Col>
        <Col flex="323px">
          <RightCard />
        </Col>
      </Row>
    </SubscriptionTypeListWidget>
  );
};
