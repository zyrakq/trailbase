import { ComponentPropsWithRef, ReactNode } from 'react';

import styled, {
  DefaultTheme,
  FlattenInterpolation,
  ThemeProps,
  css,
} from 'styled-components';

type ColorStylesMap = Record<
  NonNullable<ButtonProps['color']>,
  FlattenInterpolation<ThemeProps<DefaultTheme>>
>;

type VariantMap = Record<NonNullable<ButtonProps['variant']>, ColorStylesMap>;

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  startIcon?: ReactNode;
  block?: boolean;
  size?: 'small' | 'default' | 'large';
  color?: 'default' | 'primary' | 'secondary' | 'dangerous';
  variant?: 'default' | 'outlined';
  textTransform?:  'none' | 'uppercase' | 'lowercase';
}

export const solidColorStyles: ColorStylesMap = {
  default: css`
    color: ${({ theme }) => theme.palette.primary.contrastText};
    background: ${({ theme }) => theme.palette.primary.main};
    &:hover, &:active {
      background: ${({ theme }) => theme.palette.primary.dark};
    }
  `,
  primary: css`
    color: ${({ theme }) => theme.palette.primary.contrastText};
    background: ${({ theme }) => theme.palette.primary.main};
    &:hover, &:active {
      background: ${({ theme }) => theme.palette.primary.dark};
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.secondary.contrastText};
    background: ${({ theme }) => theme.palette.secondary.main};
    &:hover, &:active {
      background: ${({ theme }) => theme.palette.secondary.dark};
    }
  `,
  dangerous: css`
    color: ${({ theme }) => theme.palette.error.contrastText};
    background: ${({ theme }) => theme.palette.error.main};
    &:hover, &:active {
      background: ${({ theme }) => theme.palette.error.dark};
    }
  `,
};

export const outlinedColorStyles: ColorStylesMap = {
  default: css`
    color: ${({ theme }) => theme.palette.secondary.dark};
    border: solid 1px ${({ theme }) => theme.palette.secondary.light};
    background: ${({ theme }) => theme.palette.secondary.contrastText};
    &:hover, &:active {
      ${({ theme }) => theme.palette.type === "light" ? 
        `color: ${theme.palette.primary.dark}`
        : `background: ${theme.palette.secondary.light}` 
      };
      ${({ theme }) => theme.palette.type === "light" ? ``: `border: solid 1px ${theme.palette.secondary.main}`};
    }
  `,
  primary: css`
    color: ${({ theme }) => theme.palette.secondary.dark};
    border: solid 1px ${({ theme }) => theme.palette.secondary.light};
    background: ${({ theme }) => theme.palette.secondary.contrastText};
    &:hover, &:active {
      ${({ theme }) => theme.palette.type === "light" ? 
        `color: ${theme.palette.primary.dark}`
        : `background: ${theme.palette.secondary.light}` 
      };
      ${({ theme }) => theme.palette.type === "light" ? ``: `border: solid 1px ${theme.palette.secondary.main}`};
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.primary.dark};
    border: solid 1px ${({ theme }) => theme.palette.primary.light};
    background: ${({ theme }) => theme.palette.primary.contrastText};
    &:hover, &:active {
      color: ${({ theme }) => theme.palette.secondary.dark};
      border: solid 1px ${({ theme }) => theme.palette.primary.main};
    }
  `,
  dangerous: css`
    color: ${({ theme }) => theme.palette.error.main};
    border: solid 1px ${({ theme }) => theme.palette.error.main};
    &:hover, &:active {
      color: ${({ theme }) => theme.palette.error.dark};
      border: solid 1px ${({ theme }) => theme.palette.error.dark};
    }
  `,
};

const blockWidthStyles = css`
  width: 100%;
`;

export const disabledStyles = {
  default: css`
    &:disabled {
      color: ${({ theme }) => theme.palette.type === 'light' ? theme.palette.primary.contrastText: theme.palette.text.disabled} !important;
      background: ${({ theme }) => theme.palette.actions.disabled} !important;
    }
  `,
  outlined: css`
    &:disabled {
      color: ${({ theme }) => theme.palette.text.disabled} !important;
    }
  `,
};

export const sizeStyles = {
  small: css`
    font-size: 14px;
    line-height: 19px;
    padding: 5px 16px;
    height: 32px;
  `,
  default: css`
    font-size: 16px;
    line-height: 19px;
    padding: 10px 20px;
    height: 40px;
  `,
  large: css`
    font-size: 16px;
    line-height: 19px;
    padding: 14px 32px;
    height: 47px;
  `,
};

const variantMap: VariantMap = {
  default: solidColorStyles,
  outlined: outlinedColorStyles,
};

export const styledButtonCss = css<ButtonProps>`
  cursor: pointer;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  text-decoration: none;
  font-style: normal;
  letter-spacing: 0;
  font-weight: 600;
  text-align: left;
  box-sizing: border-box;
  border: none;
  border-radius: 8px;
  text-transform: ${({ textTransform = 'uppercase' }) => textTransform};
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background: none;

  ${({ size = 'default' }) => sizeStyles[size]}
  ${({ variant = 'default', color = 'default' }) => variantMap[variant][color]}
  ${({ block: fullWidth = false }) => fullWidth && blockWidthStyles}
  ${({ variant = 'default' }) => disabledStyles[variant]}
  

  &:disabled {
    cursor: default;
    pointer-events: none;
  }

  &:focus {
    outline: none;
  }

  .button-startIcon {
    display: flex;
    margin-left: -4px;
    margin-right: 8px;
  }
`;

export const StyledButton = styled.button<ButtonProps>`
  ${styledButtonCss};
`;
