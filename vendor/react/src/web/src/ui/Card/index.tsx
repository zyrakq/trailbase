import AntCard, { CardProps } from 'antd/lib/card';
import styled from 'styled-components';

export type { CardProps } from 'antd/lib/card';

export const Card = styled((props: CardProps) => (
  <AntCard {...props} />
))`
  &.ant-card {
    background: ${({ theme }) => theme.palette.background.paper};
  }
`;
