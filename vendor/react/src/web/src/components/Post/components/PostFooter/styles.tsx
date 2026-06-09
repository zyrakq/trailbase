import styled from "styled-components";
import { IconButton } from "@/ui";

export const ControlPaper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, min-content);
  grid-column-gap: 16px;
  justify-content: start;
`;

export const PostButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: 16px;
  display: grid;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  color: ${({ theme }) => theme.palette.text.secondary};
  grid-template-columns: repeat(2, min-content);
  grid-column-gap: 5px;
  padding: 6px 12px;
  height: 32px;
  width: auto;
`;

export const PostFooterContentWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 0 24px 0;
`;

export const PostFooterWrapper = styled.div`
  padding: 0 24px 0 24px;
`;
