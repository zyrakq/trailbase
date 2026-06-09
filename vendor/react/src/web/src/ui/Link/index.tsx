import { Typography } from "antd";
import { LinkProps as AntLinkProps } from "antd/lib/typography/Link";
import styled, { css } from "styled-components";

export interface LinkProps extends AntLinkProps {
    variant?: 'default' | 'text' | 'dashed';
    color?: 'primary' | 'secondary';
}



const defaultColorStyles = {
  primary: css`
    color: ${({ theme }) => theme.palette.primary.main};
    position: relative;
    &:hover {
      color: ${({ theme }) => theme.palette.primary.dark};
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.palette.secondary.main};
    &:hover {
      color: ${({ theme }) => theme.palette.text.secondary};
    }
  `,
};

const textStyle = css`
  font-weight: 400;
  font-size: 16px;
`;

const textColorStyles = {
    primary: css`
      ${textStyle}
      color: ${({ theme }) => theme.palette.text.primary};
      &:hover {
        color: ${({ theme }) => theme.palette.primary.light};
      }
    `,
    secondary: css`
      ${textStyle}
      color: ${({ theme }) => theme.palette.text.secondary};
      &:hover {
        color: ${({ theme }) => theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light};
      }
    `,
};

const dashedStyle = css`
  position: relative;
  &:hover {
    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 1px;
      opacity: 0.3;
    }
  }
`;

const dashedColorStyles = {
  primary: css`
    ${dashedStyle}
    color: ${({ theme }) => theme.palette.text.primary};
    &:hover {
      color: ${({ theme }) => theme.palette.text.primary};
      &::after {
        background-color: ${({ theme }) => theme.palette.text.primary};
      }
    }
  `,
  secondary: css`
    ${dashedStyle}
    color: ${({ theme }) => theme.palette.secondary.main};
    &:hover {
      color: ${({ theme }) => theme.palette.secondary.main};
      &::after {
        background-color: ${({ theme }) => theme.palette.secondary.main};
      }
    }
  `,
};

export const Link = styled(Typography.Link)<LinkProps>`
&.ant-typography {
  margin: 0;
  line-height: 100%;
  text-decoration: none;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1);

  ${({ variant = 'default', color = 'primary' }) => {
    switch (variant) {
      case 'text':
        return textColorStyles[color];
      case 'dashed':
        return dashedColorStyles[color];
      default:
        return defaultColorStyles[color];
    }
  }}
}
`;