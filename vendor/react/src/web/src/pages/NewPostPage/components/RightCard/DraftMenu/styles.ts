import styled from 'styled-components';
import { IconButton } from '@/ui';

export const StyledMenuWrapper = styled.div`
  cursor: pointer;
  white-space: nowrap;
  border-radius: 0;
  margin: 35px 0 23px 0;
`;

export const TrashButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  margin-right: 10px;
  &:hover {
    color: ${({ theme }) => theme.palette.error.main};
  }
`;
