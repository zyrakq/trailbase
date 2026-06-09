import { FC, memo } from "react";
import { StyledSideNavWrapper } from "./styles";
import { Text } from "@/ui";

export const LeftBar: FC = memo(() => {
  return (
    <StyledSideNavWrapper>
      <Text component="span" style={{ fontSize: 13 }}>
        © 2023 ARGIAGO. All rights reserved.
      </Text>
    </StyledSideNavWrapper>
  );
});
