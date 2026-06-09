import styled from 'styled-components';
import { List } from 'antd';



export const CommentItem = styled(List.Item)`
&.ant-list-item .ant-list-item-action {
    align-self: flex-start;
    margin-inline-start: 25px;

    li {
        display: flex;
    }
}
`;


export const CommentItemMeta = styled(List.Item.Meta)`
&.ant-list-item-meta {
    align-items: flex-start;
        && .ant-list-item-meta-avatar {
        margin-inline-end: 10px;
    }
    & .ant-list-item-meta-content .ant-list-item-meta-title {
        margin-top: 0;
        color: ${({ theme }) => theme.palette.text.secondary};

        & > svg {
            margin-left: 5px;
            margin-top: -5px;
            color: ${({ theme }) => theme.palette.primary.main}
        }
    }
}

`;
