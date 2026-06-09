import styled from "styled-components";

import { Text } from "@/ui";

export const ContainerWrapper = styled.div`
  position: absolute;
  top: 85%;
  left: 50%;
  transform: translate(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    color: white;
  }
`;

export const SunscriptionTypeText = styled(Text)`
  font-size: 18px;
  margin-bottom: 5px;
  color: white;
`;

export const TeaserContainer = styled.div`
  position: absolute;
  top: 2%;
  padding: 24px;
  span {
    color: white;
  }
`;
