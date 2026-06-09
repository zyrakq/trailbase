import { FC, useMemo } from 'react';

import { TagProps } from 'antd/lib/tag';
import { ConfigProvider } from 'antd';
import { useTheme } from 'styled-components';
import { Tag as AntTag } from 'antd';
import { Close } from '@styled-icons/material-outlined';

export type { TagProps } from 'antd/lib/tag';

export const Tag: FC<TagProps> = (props) => {
    const theme = useTheme();
    const colorText = useMemo(() => theme.palette.type === 'light' ? theme.palette.gray[600] : theme.palette.gray[300], [theme]);
    const colorFillQuaternary = useMemo(() => theme.palette.type === 'light' ? theme.palette.gray[50] : theme.palette.gray[800], [theme]);
    return (
        <ConfigProvider
                theme={{
                    token: {
                        colorText,
                        borderRadiusSM: 20,
                        fontSize: 16,
                        lineHeight: 2.1,
                        colorFillQuaternary,
                        lineType: 'none',
                        
                        lineWidth: -2,
                        paddingXXS: 4
                    }
                }}
            >
            <AntTag closeIcon={<Close color={colorText} size={14}/>} {...props} />
        </ConfigProvider>
        );
};