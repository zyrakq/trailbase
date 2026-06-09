import TextArea, { TextAreaProps } from 'antd/lib/input/TextArea';
import styled from 'styled-components';


export const StyledTextArea = styled(TextArea)<TextAreaProps>`

  resize: none;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 46px;
  padding: 11px;

  color: ${({ theme }) => theme.palette.secondary.dark};
  border-color: ${({ theme }) => theme.palette.secondary.light};
  background-color: ${({ theme }) => theme.palette.background.paper};


  &::placeholder {
    color: ${({ theme }) => theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main};
  }

  &:focus, &:hover, &:active {
    border-color: ${({ theme }) => theme.palette.primary.light};
    box-shadow: none;
  }
`;
