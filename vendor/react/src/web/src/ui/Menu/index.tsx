import AntMenu, { MenuProps } from 'antd/lib/menu';
import styled from 'styled-components';

export type { MenuProps } from 'antd/lib/menu';

export type MenuClickEventHandler = NonNullable<MenuProps['onClick']>;

export const Menu = styled((props: MenuProps) => (
  <AntMenu {...props} />
))`
  &.ant-menu {
    background: ${({ theme }) => theme.palette.background.paper};

  }
  &.ant-dropdown-menu {
    padding: 8px 0;
    margin: 0;
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: ${({ theme }) => theme.shadows[2]};
    overflow: auto;
    border-radius: 4px;
    max-width: 332px;
    max-height: 500px;
  }
`;
