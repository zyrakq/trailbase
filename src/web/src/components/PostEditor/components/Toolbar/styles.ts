import styled from 'styled-components';


export const StyledToolbar = styled.div`
    position: relative;
    padding: 1px 18px 17px;
    margin: 0 -20px;
    border-bottom: 2px solid ${({ theme }) => theme.palette.background.default };
    margin-bottom: 20px;
    & > * {
        display: inline-block;
    }
    & > * + * {
        margin-left: 15px;
    }
`;