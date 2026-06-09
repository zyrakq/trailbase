import styled from 'styled-components';
import { Image, Widget } from '@/ui';

export const StyledWidget = styled(Widget)`
  padding: 0 15px;
`;


export const StyledImage = styled(Image)`
  border: 1px solid ${({ theme }) => theme.palette.secondary.light};
  border-radius: 2px;
`;
