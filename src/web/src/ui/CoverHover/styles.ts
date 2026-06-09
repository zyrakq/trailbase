import styled from 'styled-components';

export const StyledBackdrop = styled.div`
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  background-color: ${({ theme }) => theme.palette.background.backdrop};
  border-radius: 8px;
  transition: opacity 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 24px;
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

export const StyledHoverRoot = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  &:hover {
    ${StyledBackdrop} {
      opacity: 1;
    }
  }
`;
