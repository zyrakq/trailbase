import styled from 'styled-components';
import Item, { ListItemProps } from 'antd/lib/list/Item';


export const WallItem = styled((props: ListItemProps) => <Item {...props} />)`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  margin: 0 0 16px 0;
  min-width: 100%;
  line-height: 1.5;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(3, min-content);
  word-wrap: break-word;
  grid-row-gap: 16px;
  box-shadow: none;
  border-radius: 8px;
  display: block;
  background-color: ${({ theme }) => theme.palette.background.paper};
  padding: 0;
`;

export const PostMain = styled.div`
  min-width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(3, min-content);
  grid-row-gap: 16px;
  word-wrap: break-word;
  border-radius: 8px;
  margin-bottom: 16px;
  .ant-list-item-meta-title:only-child {
    margin-top: 0;
  }
`;
