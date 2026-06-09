import { ComponentPropsWithRef } from 'react';

import styled from 'styled-components';

export type AppBarProps = ComponentPropsWithRef<'header'>;

export const AppBar = styled.header`
  position: fixed;
  top: 0;
  width: 100%;
  line-height: 100%;
  background: ${({ theme }) => theme.palette.background.paper};
  ${({ theme }) => theme.palette.type === "light" ? 
    `box-shadow: ${theme.shadows[1]}`
    : `` 
  };
  border-bottom: ${({ theme }) => theme.palette.background.default} 1px solid;
  z-index: 1000;
`;
