import AntAvatar from 'antd/lib/avatar';
import styled from 'styled-components';

export const { Group: AvatarGroup } = AntAvatar;

export const StyledAntAvatar = styled(AntAvatar)`
  &.ant-avatar-square {
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.palette.secondary.light};
  
  }
  &.ant-avatar-circle {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.primary.contrastText};
    border: 1px solid ${({ theme }) => theme.palette.secondary.main};
  
  }
`;
