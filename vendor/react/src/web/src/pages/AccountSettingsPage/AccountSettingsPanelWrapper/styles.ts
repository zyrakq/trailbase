import { Link } from 'react-router-dom';

import styled from 'styled-components';

import { Menu, MenuItem, Widget } from '@/ui';

export const NavMenuItem = styled(MenuItem)`
  &.ant-menu-item-selected {
    border-right: none;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  &.ant-menu-item::after {
    opacity: 0 !important;
  }
`;

export const NavMenu = styled(Menu)`
  border-right: white;
`;

export const NavMenuLink = styled(Link)`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  & > svg {
    margin-right: 8px;
  }
`;

export const StyledWidget= styled(Widget)`
  padding: 16px;
`;
