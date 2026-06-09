import { FC } from 'react';

import { StyledIconProps } from '@styled-icons/styled-icon';

import { iconsMap } from './icons';

export interface IconProps extends StyledIconProps {
  icon: string;
}

export const Icon: FC<IconProps> = ({ icon, ...props }) => {
  const IconComponent =
    icon in iconsMap ? iconsMap[icon] : iconsMap.default;

  return <IconComponent {...props} />;
};