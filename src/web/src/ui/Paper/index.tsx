import React from 'react';

import { BasePaperProps, StyledPaper } from './styles';

export type PaperProps = BasePaperProps & React.ComponentPropsWithRef<'div'>;

export const Paper = React.forwardRef<HTMLDivElement, PaperProps>(
  (props, ref) => <StyledPaper ref={ref} {...props} />,
);
