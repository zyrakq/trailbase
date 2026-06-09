import { FC } from 'react';

import { InputNumberProps } from 'antd/lib/input-number';
import { ConfigProvider } from 'antd';
import { useTheme } from 'styled-components';
import { StyledInputNumber } from './styles';

export type { InputNumberProps } from 'antd/lib/input-number';

export const InputNumber: FC<InputNumberProps> = (props) => {
    const theme = useTheme();
    return (
        <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: theme.palette.primary.main,
                    }
                }}
            >
            <StyledInputNumber {...props} />
        </ConfigProvider>
        );
};