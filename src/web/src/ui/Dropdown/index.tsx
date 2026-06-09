import { CSSProperties, FC } from 'react';

import AntDropdown, { DropDownProps } from 'antd/lib/dropdown';
import { useTheme } from 'styled-components';

export type { DropDownProps } from 'antd/lib/dropdown';

export const Dropdown: FC<DropDownProps> = (props) => {

  const theme = useTheme();

  const newStyle = {
    position: 'fixed',
    border: `solid 1px ${theme.palette.secondary.light}`,
    borderRadius: 4,
    userSelect: 'none',
  } as CSSProperties;

  const { overlayStyle } = props;

  return (
    <AntDropdown {...props} overlayStyle={{...newStyle, ...overlayStyle}}/>
  )
}
