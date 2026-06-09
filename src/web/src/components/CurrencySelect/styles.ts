import styled from 'styled-components';

import { IconButton } from '@/ui';

export const TrashButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  &:hover {
    color: ${({ theme }) => theme.palette.error.main};
  }
`;
