import React from 'react';

import { StyledText } from './styles';

export interface TextProps extends React.ComponentPropsWithRef<'p'> {
  color?: 'primary' | 'secondary';
  component?: 'p' | 'span';
}

export const Text = React.forwardRef<HTMLHeadingElement, TextProps>(
  ({ component, color, children, ...props }, ref) => (
    <StyledText
      as={component}
      color={color ?? 'default'}
      component={component ?? 'p'}
      ref={ref}
      {...props}
    >
      {children}
    </StyledText>
  ),
);
