import React, { FC } from 'react';
import {
  WidgetPaper
} from './styles';

export interface BaseWidgetProps {
  children: React.ReactNode;
}

export type WidgetProps = BaseWidgetProps & React.ComponentPropsWithRef<'div'>;

export const Widget: FC<WidgetProps> = (props) => {
  const { children } = props;

  return (
    <WidgetPaper {...props}>
      {children}
    </WidgetPaper>
  );
};
