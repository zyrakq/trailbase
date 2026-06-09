import React from 'react';

import styled, { css } from 'styled-components';

export interface ToolBarProps extends React.ComponentPropsWithRef<'header'> {
  size?: 'normal' | 'large';
}

export const ToolBar = styled.div<ToolBarProps>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  ${({ size = 'normal' }) => {
    switch (size) {
      case 'large':
        return css`
          min-height: 64px;
          padding-left: 24px;
          padding-right: 24px;
        `;

      default:
        return css`
          min-height: 42px;
          padding-left: 10px;
          padding-right: 10px;
        `;
    }
  }}
`;
