import { AppBar, Container, ToolBar } from "@/ui";

import { LeftBar } from "./LeftBar";
import { RightBar } from "./RightBar";
import { EmptySpace } from "./styles";

export const Header = () => {
  return (
    <AppBar>
      <Container justify="center" fluid>
        <ToolBar size="large">
          <LeftBar />
          <EmptySpace />
          <RightBar />
        </ToolBar>
      </Container>
    </AppBar>
  );
};
