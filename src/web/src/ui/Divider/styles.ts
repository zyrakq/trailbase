import styled from 'styled-components';

import AntDivider, { DividerProps } from 'antd/lib/divider';


export const StyledDivider = styled(AntDivider)<DividerProps>`
border-block-start: 2px solid ${({ theme }) => theme.palette.background.default};
`;