import styled from 'styled-components';


export const CroppedWrapper = styled.div`
  overflow: hidden;
  position: relative;
  transition: height 0.3s ease;
`;

export const GradientWrapper = styled.div`
  background: ${({ theme }) => theme.palette.type === 'light' ?
  'linear-gradient(to bottom, transparent, white)'
  : 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgb(26, 26, 26) 100%)'
  };
  height: 100px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  zIndex: 1;
`;