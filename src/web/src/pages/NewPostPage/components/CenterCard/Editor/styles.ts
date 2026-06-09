import { Divider } from 'antd';
import styled from 'styled-components';

import { FormItem, Paper } from '@/ui';

export const StyledPaper = styled(Paper)`
  padding: 24px;
  margin-bottom: 12px;
  border-radius: 8px;
  transition: height 0.3s ease-in-out, margin-bottom 0.3s ease-in-out;
`;

export const StyledContainer = styled.div`
  max-width: 100%;
  display: flex;
  justify-content: space-between;
`;

export const FormDivider = styled(Divider)`
  margin: 18px 0 16px;
`;

export const StyledFormItem = styled(FormItem)`
  &.ant-form-item {
    margin-bottom: 0;
    width: 100%;
    .ant-form-item-control-input-content {
      height: 380px;
    }
  }
`;
