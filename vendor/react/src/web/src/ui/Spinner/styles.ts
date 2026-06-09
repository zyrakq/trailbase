import styled, { keyframes } from 'styled-components';

import { Spinner2 } from '@styled-icons/icomoon';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const StyledSpinner = styled(Spinner2)`
  transform: rotate(45deg);
  animation-name: ${spin};
  animation-duration: 1.2s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  color: ${({ theme }) => theme.palette.primary.light};
`;
