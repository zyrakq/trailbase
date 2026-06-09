import { List } from 'antd';
import styled from 'styled-components';

export const StyledListItem = styled(List.Item)`
&.ant-list-item {
  margin-bottom: 10px;
  border-block-end: none;
  padding: 0;
  justify-content: flex-start;
}
`;