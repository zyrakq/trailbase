import styled from 'styled-components';

import { Button } from '@/ui';

export const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  max-height: 40px;
  font-weight: 600;
`;

export const SubmitButton = styled(Button)`
  border-radius: 8px;
  font-size: 14px;
`;

export const ResetButton = styled(Button)`
  border-radius: 8px;
  font-size: 14px;
`;
