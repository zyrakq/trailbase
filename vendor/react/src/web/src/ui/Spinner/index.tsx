import { FC } from 'react';

import AntSpin, { SpinProps as AntSpinProps } from 'antd/lib/spin';

import { StyledSpinner } from './styles';

export type { SpinProps as AntSpinProps } from 'antd/lib/spin';

export interface SpinProps extends AntSpinProps {
    fontSize: number;
}

export const Spinner: FC<SpinProps> = (props) => {
    return (
        <AntSpin
            indicator={<StyledSpinner style={{ fontSize: props.fontSize }}/>}
            {...props}
        />
    )
};