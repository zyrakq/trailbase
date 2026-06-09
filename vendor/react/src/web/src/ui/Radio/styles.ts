import styled, { css } from 'styled-components';

import { RadioProps } from 'antd/lib/radio';

import { Radio as AntRadio } from 'antd';

export const colorStyles = {
    light: css``,
    dark: css`
        background-color: ${({ theme }) => theme.palette.gray[600]};
        border-color: ${({ theme }) => theme.palette.gray[600]};
        background-image: linear-gradient(${({ theme }) => `${theme.palette.gray[700]},${theme.palette.gray[600]}`});
    `,
};


export const StyledRadio = styled(AntRadio)<RadioProps>`
    & .ant-radio-inner {
        ${({ theme }) => colorStyles[theme.palette.type]};
    }

    & .ant-radio-checked .ant-radio-inner {
        border-color: ${({ theme }) => theme.palette.primary.main};
        background-color: ${({ theme }) => theme.palette.primary.main};
        background-image: linear-gradient(${({ theme }) => `${theme.palette.primary.light},${theme.palette.primary.dark}`});
    }
`;