import styled from 'styled-components';

import 'react-virtualized/styles.css';

export const Gap = styled.div`
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 16px;
  }
`;

export const PostWrapper = styled.div`
  &:first-child:not(.wall_without_tabs) li {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
`;
