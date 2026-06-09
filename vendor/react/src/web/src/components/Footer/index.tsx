import { Container, FooterBar, ToolBar } from "@/ui";

import { LeftBar } from "./LeftBar";
import { RightBar } from "./RightBar";
import { EmptySpace } from "./styles";

export const Footer = () => {
  return (
    <FooterBar style={{ bottom: 0 }}>
      <Container justify="center" fluid>
        <ToolBar style={{ marginBottom: 4 }}>
          <LeftBar />
          <EmptySpace />
          <RightBar />
        </ToolBar>
      </Container>
    </FooterBar>
  );
};
