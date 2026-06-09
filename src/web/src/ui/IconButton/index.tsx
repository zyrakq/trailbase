import React from 'react';

import { IconButtonProps, StyledButton } from './styles';

export type { IconButtonProps } from './styles';

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, component, href, target, ...buttonProps }, ref) => (
    <StyledButton
      as={component}
      href={component === 'a' && buttonProps.disabled ? undefined : href}
      ref={ref}
      tabIndex={0}
      target={component === 'a' ? target : undefined}
      type="button"
      {...buttonProps}
    >
      {children}
    </StyledButton>
  ),
);
