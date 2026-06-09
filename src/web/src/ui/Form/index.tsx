import { FC, ReactNode } from 'react';

import AntForm, { FormProps } from 'antd/lib/form';

export type { FormProps } from 'antd/lib/form';

export const Form: FC<FormProps> = (props) => <AntForm {...props } children={props.children as ReactNode} />;

