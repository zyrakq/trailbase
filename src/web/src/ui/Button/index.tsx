import React from 'react';

import { ButtonProps, StyledButton } from './styles';

export type { ButtonProps } from './styles';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, startIcon, ...buttonProps }, ref) => (
    <StyledButton ref={ref} tabIndex={0} type="button" {...buttonProps}>
      {startIcon && <span className="button-startIcon">{startIcon}</span>}
      {children}
    </StyledButton>
  ),
);
