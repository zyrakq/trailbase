import { ComponentPropsWithRef } from 'react';

import styled, { css } from 'styled-components';

export type IconButtonProps = ComponentPropsWithRef<'button'> & {
  component?: 'a' | 'button';
  href?: string;
  target?: string;
  edge?: 'left' | 'right';
  color?: 'primary' | 'secondary';
};

export const edgeStyles = {
  left: css`
    margin-left: -10px;
  `,
  right: css`
    margin-right: -10px;
  `,
};


const btnColorStyles = {
  primary: css`
    color: ${({ theme }) => theme.palette.primary.main};
    &:hover {
      color: ${({ theme }) => theme.palette.primary.dark};
    }
    &:disabled {
      color: ${({ theme }) => theme.palette.text.disabled} !important;
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.secondary.main};
    &:hover {
      color: ${({ theme }) => theme.palette.secondary.dark};
    }
    &:disabled {
      color: ${({ theme }) => theme.palette.text.disabled} !important;
    }
  `,
};


export const StyledButton = styled.button<IconButtonProps>`
  cursor: pointer;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: none;
  background-color: unset;
  padding: 0;
  margin: 0;
  width: 40px;
  height: 40px;
  transition: all 300ms cubic-bezier(0.645, 0.045, 0.355, 1);

  ${({ edge }) => edge && edgeStyles[edge]}

  ${({ color = 'primary' }) => btnColorStyles[color]}

  &:disabled {
    cursor: default;
    pointer-events: none;
  }

  &:focus {
    outline: none;
  }
`;
