import { Empty } from 'antd';
import styled from 'styled-components';

export const EmptyBox = styled(Empty).attrs((props) => ({
  imageStyle: props.imageStyle ?? {
    height: 100,
  },
}))`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const EmptyBoxBig = styled(Empty).attrs((props) => ({
  imageStyle: props.imageStyle ?? {
    height: 158,
  },
}))`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
