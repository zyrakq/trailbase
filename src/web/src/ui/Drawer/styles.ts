import styled from 'styled-components';


export const StyledDrawerBody = styled.div`
  padding: 15px;
  overflow: auto;
  height: 100%;

  &::-webkit-scrollbar {
    width: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #ccc;
  }

  &::-webkit-scrollbar-thumb:active {
    background-color: #ccc;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 4px;
  }
`;