import styled from 'styled-components';

import { Paper, Tag } from '@/ui';

export const StyledPaper = styled(Paper)`
  padding: 24px 24px 14px 24px;
  margin-bottom: 12px;
  border-radius: 8px;
  transition: height 0.3s ease-in-out, margin-bottom 0.3s ease-in-out;
`;

export const StyledTag = styled(Tag)`
  margin-bottom: 10px;
`;
