
import React from 'react';
import { StyledToolbar } from './styles';

export const Toolbar = React.forwardRef<HTMLDivElement, { readOnly: boolean, children: React.ReactNode }>(
  ({ readOnly, children, ...props }, ref) => (
    <StyledToolbar ref={ref} {...props} hidden={readOnly}>
      {children}
    </StyledToolbar>
  ),
);