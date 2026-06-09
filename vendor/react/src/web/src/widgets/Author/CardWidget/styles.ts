import styled from 'styled-components';

import { Paper } from '@/ui';

export const ProfileInfoPaper = styled(Paper)`
  position: relative;
  padding: 24px 0;
  border-radius: 8px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }
`;

export const StyledAvatarContainer = styled.div`
  padding: 0 24px;
`;
