import { FC } from 'react';

import { InputProps, TextAreaProps } from 'antd/lib/input';
import { ConfigProvider } from 'antd';
import { useTheme } from 'styled-components';
import { Input as AntInput } from 'antd';

export type { InputProps, TextAreaProps } from 'antd/lib/input';

export const Input: FC<InputProps> = (props) => {
    const theme = useTheme();
    return (
        <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: theme.palette.primary.main,
                        colorBgContainer: theme.palette.background.paper,
                        colorTextPlaceholder: theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main,
                        colorText: theme.palette.secondary.dark,
                        colorPrimaryActive: theme.palette.primary.light,
                        controlOutlineWidth: 0,
                        controlHeightLG: 44,
                        fontSizeLG: 14
                    }
                }}
            >
            <AntInput {...props} />
        </ConfigProvider>
        );
};

const { TextArea } = AntInput;

export const InputTextArea: FC<TextAreaProps> = (props) => {
    const theme = useTheme();
    return (
        <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: theme.palette.primary.main,
                        colorBgContainer: theme.palette.background.paper,
                        colorTextDescription: theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main,
                        colorTextPlaceholder: theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main,
                        colorText: theme.palette.secondary.dark,
                        colorPrimaryActive: theme.palette.primary.light,
                        controlOutlineWidth: 0,
                        controlHeightLG: 44,
                        fontSizeLG: 14
                    }
                }}
            >
            <TextArea {...props} />
        </ConfigProvider>
        );
};