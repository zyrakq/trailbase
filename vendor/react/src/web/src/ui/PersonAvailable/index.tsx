import { ComponentPropsWithRef, FC } from 'react';
import styled, { css, useTheme } from 'styled-components';

interface PersonAvailableProps extends ComponentPropsWithRef<'span'> {
  disabled?: boolean;
  size: number;
}

interface CircuitSvgProps extends ComponentPropsWithRef<'svg'> {
  disabled?: boolean;
}

const CircuitSvg = styled.svg<CircuitSvgProps>`
  .circuit-path {
    fill: ${({ theme }) => theme.palette.secondary.dark};

    ${({ disabled }) => disabled && css`
        fill: ${({ theme }) => theme.palette.secondary.main};
    `}
  }
  .fill-path {
    fill: ${({ theme }) => theme.palette.primary.dark};

    ${({ disabled }) => disabled && css`
        fill: ${({ theme }) => theme.palette.primary.main};
    `}
  }
`;

export const PersonAvailable: FC<PersonAvailableProps> = (props) => {

  const theme = useTheme();

  return (
    <span {...props} style={{ margin: '5px 5px 0 0'}}>
      <CircuitSvg disabled={props.disabled} viewBox={`0 0 ${props.size} ${props.size}`} height={props.size} width={props.size} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-path" d="M17.5 12a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"></path>
        <path fill={theme.palette.secondary.contrastText} d="M14.85 17.15a.5.5 0 0 0-.7.7l2 2c.2.2.5.2.7 0l4-4a.5.5 0 0 0-.7-.7l-3.65 3.64-1.65-1.64Z"></path>

        <path className="circuit-path" d="M12.02 14c-.3.46-.53.97-.7 1.5H4.24a.75.75 0 0 0-.75.75v.58c0 .53.2 1.05.54 1.46C5.3 19.76 7.26 20.5 10 20.5c.6 0 1.16-.03 1.68-.1.25.49.55.95.91 1.36-.8.16-1.66.24-2.59.24-3.15 0-5.53-.9-7.1-2.74a3.75 3.75 0 0 1-.9-2.43v-.58C2 15 3.01 14 4.25 14h7.77Z"></path>
        <path className="circuit-path" d="M10 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"></path>
        <path fill={theme.palette.secondary.contrastText} d="M10 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"></path>
      </CircuitSvg>
    </span>
  );

};