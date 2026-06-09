import { FC } from 'react';

import AntAvatar, { AvatarProps } from 'antd/lib/avatar';

import { StyledAntAvatar } from './styles';

export type { AvatarProps } from 'antd/lib/avatar';

export const Avatar: FC<AvatarProps> = (props) => (
  <StyledAntAvatar {...props} />
);

export const { Group: AvatarGroup } = AntAvatar;
