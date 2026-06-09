import { FC } from 'react';

import AntDrawer, { DrawerProps } from 'antd/lib/drawer';

import { StyledDrawerBody } from './styles';
import { useTheme } from 'styled-components';

export type { DrawerProps } from 'antd/lib/drawer';

export const Drawer: FC<DrawerProps> = (props) => {
    const theme = useTheme();
    return (
        <AntDrawer
            {...props}
            contentWrapperStyle={{
                marginTop: 64,
                width: 300,
                boxShadow: 'none',
                border: `${theme.palette.background.default} 1px solid`,
                ...props.contentWrapperStyle
            }}
            bodyStyle={{ padding: 0, overflow: 'hidden', ...props.bodyStyle }}
            style={{ background: theme.palette.background.paper }}
        >
            <StyledDrawerBody>
                {props.children}
            </StyledDrawerBody>
        </AntDrawer>
    )
};