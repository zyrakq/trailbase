import { FC } from 'react';

import { SkeletonAvatarProps, StyledSkeletonAvatar, StyledSkeletonInput } from './styles';
import { SkeletonInputProps } from 'antd/lib/skeleton/Input';

export const SkeletonAvatar: FC<SkeletonAvatarProps> = (props) => (
  <StyledSkeletonAvatar {...props} />
);




export const SkeletonInput: FC<SkeletonInputProps> = (props) => (
  <StyledSkeletonInput {...props} />
);