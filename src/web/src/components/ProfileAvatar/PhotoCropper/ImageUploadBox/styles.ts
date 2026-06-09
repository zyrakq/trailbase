import { colord } from 'colord';
import styled from 'styled-components';

export const StyledBoxWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-align: center;
  margin-bottom: 16px;
  border-radius: 8px;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const StyledBox = styled.div`
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background: ${({ theme }) =>
    colord(theme.palette.primary.main).lighten(0.34).toHex()};
  color: ${({ theme }) => theme.palette.primary.main};
  text-align: center;
  min-height: 113px;
  height: 100%;
`;
