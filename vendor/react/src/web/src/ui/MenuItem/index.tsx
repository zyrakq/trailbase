import AntMenuItem, { MenuItemProps } from 'antd/lib/menu/MenuItem';
import { colord } from 'colord';
import styled from 'styled-components';

export type { MenuItemProps } from 'antd/lib/menu/MenuItem';

export const MenuItem = styled((props: MenuItemProps) => (
  <AntMenuItem {...props} />
))`
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  text-align: left;
  white-space: unset;
  border-radius: 0;
  padding: 0 16px;

  &.ant-menu-item-selected {
    color: ${({ theme }) => theme.palette.type === "light" ?
      theme.palette.primary.dark
      : theme.palette.primary.contrastText
    } !important;
    background-color:  ${({ theme })  => theme.palette.type === "light" ?
      colord(theme.palette.primary.main).alpha(0.1).toHslString()
      : colord(theme.palette.primary.main).alpha(0.9).toHslString()
    } !important;
    &:after {
      content: none;
    }
  }

  &.ant-menu-item-active {
    color: ${({ theme }) => theme.palette.type === "light" ?
      theme.palette.primary.dark
      : theme.palette.primary.contrastText
    } !important;
    background-color:  ${({ theme })  => theme.palette.type === "light" ?
      colord(theme.palette.primary.main).alpha(0.1).toHslString()
      : colord(theme.palette.primary.main).alpha(0.9).toHslString()
    } !important;
  }

  &.ant-dropdown {
    &-menu-item {
      border-radius: 0 !important;
      color: ${({ theme }) => theme.palette.text.secondary} !important;
    }

    &-menu-item-selected {
      color: ${({ theme }) => theme.palette.type === "light" ?
        theme.palette.primary.dark
        : theme.palette.primary.contrastText
      } !important;
      background-color:  ${({ theme })  => theme.palette.type === "light" ?
        colord(theme.palette.primary.main).alpha(0.1).toHslString()
        : colord(theme.palette.primary.main).alpha(0.9).toHslString()
      } !important;
      &:hover, &:active {
        color: ${({ theme }) => theme.palette.type === "light" ?
          theme.palette.primary.dark
          : theme.palette.primary.contrastText
        } !important;
        background-color:  ${({ theme })  => theme.palette.type === "light" ?
          colord(theme.palette.primary.main).alpha(0.1).toHslString()
          : colord(theme.palette.primary.main).alpha(0.9).toHslString()
        } !important;
      }
    }

    &-menu-item-active {
      color: ${({ theme }) => theme.palette.type === "light" ?
      theme.palette.primary.dark
      : theme.palette.primary.contrastText
    } !important;
    background-color:  ${({ theme })  => theme.palette.type === "light" ?
      colord(theme.palette.primary.main).alpha(0.1).toHslString()
      : colord(theme.palette.primary.main).alpha(0.9).toHslString()
    } !important;
  }
`;
