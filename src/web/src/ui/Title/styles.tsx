import React from 'react';

import styled, { css } from 'styled-components';

export interface TitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: 'primary' | 'secondary';
  textTransform?:  'none' | 'uppercase' | 'lowercase';
}

export const headingStyles = {
  h1: css`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 36px;
    margin-bottom: 16px;
  `,
  h2: css`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 20px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px;
    margin-bottom: 16px;
  `,
  h3: css`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 24px;
    margin-bottom: 8px;
  `,
  h4: css`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 20px;
    margin-bottom: 8px;
  `,
  h5: css`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 20px;
    margin-bottom: 8px;
  `,
};

const colorStyles = {
  primary: css`
    color: ${({ theme }) => theme.palette.text.primary};
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.text.secondary};
  `,
};

export const StyledTitleRoot = styled.span<TitleProps>`
text-transform: ${({ textTransform = 'none' }) => textTransform};
margin: 0;
${({ variant }) => headingStyles[variant]}
${({ color }) => colorStyles[color ?? 'primary']}
`;