import styled from 'styled-components';

export interface BasePaperProps {
  elevation?: 0 | 1 | 2;
}

export const StyledPaper = styled.div<BasePaperProps>`
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ elevation = 0, theme }) => theme.shadows[elevation]};
  border-radius: 8px;
`;
