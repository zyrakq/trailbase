import { ComponentPropsWithRef } from 'react';
import styled from 'styled-components';


export interface ButtonProps extends ComponentPropsWithRef<'span'> {
    active: boolean;
    reversed?: boolean;
}


export const StyledButton = styled.span<ButtonProps>`
    cursor: pointer;
    color: ${({ theme, active }) => (active ? theme.palette.text.primary : theme.palette.text.secondary)}
`;