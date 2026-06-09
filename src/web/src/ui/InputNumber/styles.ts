import styled from 'styled-components';

import { InputNumberProps } from 'antd/lib/input-number';

import { InputNumber as AntInputNumber } from 'antd';

export const StyledInputNumber = styled(AntInputNumber)<InputNumberProps>`

color: ${({ theme }) => theme.palette.secondary.dark};
border-color: ${({ theme }) => theme.palette.secondary.light};
background-color: ${({ theme }) => theme.palette.background.paper};


& .ant-input-number .ant-input-number-input {
    color: ${({ theme }) => theme.palette.secondary.dark};
}

& .ant-input-number .ant-input-number-handler-wrap {
    background: ${({ theme }) => theme.palette.background.paper};
    border-color: ${({ theme }) => theme.palette.primary.light};
}

&.ant-input-number .ant-input-number-handler-up-inner, & .ant-input-number .ant-input-number-handler-down-inner {
    color: ${({ theme }) => theme.palette.primary.light};
}

& .ant-input-number .ant-input-number-handler-down {
    border-color: ${({ theme }) => theme.palette.primary.light};
}

& .ant-input-number .ant-input-number-handler {
    border-color: ${({ theme }) => theme.palette.primary.light};
}


& .ant-input-number .ant-input-number-input::placeholder {
  color: ${({ theme }) => theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main};
}

&:focus, &:hover, &:active {
  border-color: ${({ theme }) => theme.palette.primary.light};
  box-shadow: none;
}

& .ant-input-number-group .ant-input-number-group-addon {
    border-color: ${({ theme }) => theme.palette.secondary.light};
}

`;