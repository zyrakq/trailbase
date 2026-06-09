import AntFormItem, { FormItemProps } from 'antd/lib/form/FormItem';
import styled from 'styled-components';

export const FormItem = styled((props: FormItemProps) => (
  <AntFormItem {...props} />
))`
  & .ant-form-item-label {
    line-height: 1;
    padding-bottom: 4px;
  }
  & .ant-form-item-label label {
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
  }

  &
    .ant-form-item-label
    > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::before {
  }
  &
    .ant-form-item-label
    > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::after {
    margin-right: 4px;
    color: #ff4d4f;
    font-size: 14px;
    font-family: SimSun, sans-serif;
    line-height: 1;
    content: '*';
  }
`;
// TODO: не работает after
