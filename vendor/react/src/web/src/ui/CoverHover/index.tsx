import { MouseEventHandler, ReactNode, forwardRef } from 'react';

import { StyledBackdrop, StyledHoverRoot } from './styles';

export interface CoverHoverProps {
  onClick?: MouseEventHandler;
  content?: ReactNode;
  children?: ReactNode;
}

export const CoverHover = forwardRef<HTMLDivElement, CoverHoverProps>(
  ({ children, content, onClick }, ref) => (
    <StyledHoverRoot ref={ref}>
      <StyledBackdrop onClick={onClick}>{content}</StyledBackdrop>
      {children}
    </StyledHoverRoot>
  ),
);
