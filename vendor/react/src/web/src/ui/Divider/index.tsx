import { FC } from 'react';

import { DividerProps } from 'antd/lib/divider';
import { StyledDivider } from './styles';

export type { DividerProps } from 'antd/lib/divider';

export const Divider: FC<DividerProps> = (props) => (<StyledDivider {...props} />);