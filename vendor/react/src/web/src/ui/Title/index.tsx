import React from 'react';

import { StyledTitleRoot, TitleProps } from './styles';

export type { TitleProps } from './styles';

export const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ component, variant, children, ...restProps }, ref) => (
    <StyledTitleRoot
      as={component ?? variant}
      ref={ref}
      variant={variant}
      {...restProps}
    >
      {children}
    </StyledTitleRoot>
  ),
);
