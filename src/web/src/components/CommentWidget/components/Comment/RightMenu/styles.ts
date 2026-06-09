import styled from 'styled-components';

import { IconButton, MenuItem } from '@/ui';

export const StyledMenuItem = styled(MenuItem)`
  & svg {
    margin-right: 12px;
  }
`;


export const TrashButton = styled(IconButton)`
  &:hover {
    color: ${({ theme }) => theme.palette.error.main};
  }
`;

export const ExpandMoreButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.secondary.dark};
`;
