import { FC } from 'react';

import { RadioProps } from 'antd/lib/radio';
import { ConfigProvider } from 'antd';
import { useTheme } from 'styled-components';
import { StyledRadio } from './styles';

export type { RadioProps } from 'antd/lib/radio';

export const Radio: FC<RadioProps> = (props) => {
    const theme = useTheme();
    return (
        <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: theme.palette.primary.main,
                        
                    },
                    components: {
                        Radio: {
                            size: 20
                        }
                    },
                }}
            >
            <StyledRadio {...props} />
        </ConfigProvider>
        );
};

export const { Group: RadioGroup } = StyledRadio;