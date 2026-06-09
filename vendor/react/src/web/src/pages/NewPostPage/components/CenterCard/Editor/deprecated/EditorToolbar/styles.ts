import { colord } from 'colord';
import styled from 'styled-components';

import { Menu, MenuItem } from '@/ui';

export const EditorToolbarWrapper = styled.div`
  display: flex;
`;

export const ToolbarMenu = styled(Menu)`
  border-radius: 8px;
`;

export const ToolbarMenuItem = styled(MenuItem)`
  padding: 0;
  label {
    display: block;
    padding: 8px 16px;
    cursor: pointer;
    &:hover {
      background-color: ${({ theme }) =>
        colord(theme.palette.primary.light).alpha(0.1).toHslString()};
    }
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;
