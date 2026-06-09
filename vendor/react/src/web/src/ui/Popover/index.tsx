import AntPopover, { PopoverProps } from 'antd/lib/popover';
import { CSSProperties, FC } from 'react';
import { useTheme } from 'styled-components';

export type { PopoverProps } from 'antd/lib/popover';



export const Popover: FC<PopoverProps> = (props) => {

  const theme = useTheme();

  const overlayInnerStyle = {
    backgroundColor: `${theme.palette.background.paper}`,
    padding: '4px 12px',
    border: `solid 1px ${theme.palette.secondary.light}`,
  } as CSSProperties;
  
  return (
    <AntPopover {...props} overlayInnerStyle={{ ...overlayInnerStyle, ...props.overlayInnerStyle }}/>
  )
};
