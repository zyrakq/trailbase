import { ComponentPropsWithRef } from 'react';

import styled, { css } from 'styled-components';

export interface TextProps extends ComponentPropsWithRef<'p'> {
  color: 'default' | 'primary' | 'secondary';
  component: 'p' | 'span';
}

const textStyles = {
  p: css`
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 22px;
    margin: 24px 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  `,
  span: css`
    font-style: normal;
    font-weight: 500;
  `,
};

const colorStyles = {
  default: css`
    color: ${({ theme }) => theme.palette.secondary.main};
  `,
  primary: css`
    color: ${({ theme }) => theme.palette.text.primary};
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.text.secondary};
  `,
};

export const StyledText = styled.p<TextProps>`
  ${({ component }) => textStyles[component]}
  ${({ color }) => colorStyles[color]}
  margin: 0;
`;
