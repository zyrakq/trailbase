
import React from 'react';
import { ButtonProps, StyledButton } from './styles';

export type { ButtonProps } from './styles';

export const Button = React.forwardRef<HTMLSpanElement, ButtonProps>(
  ({ children, ...buttonProps }, ref) => (
    <StyledButton ref={ref} {...buttonProps}>
      {children}
    </StyledButton>
  ),
);