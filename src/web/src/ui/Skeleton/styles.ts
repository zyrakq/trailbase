import SkeletonAvatar, { SkeletonNodeProps } from 'antd/lib/skeleton/Node';
import SkeletonInput, { SkeletonInputProps } from 'antd/lib/skeleton/Input';
import styled from 'styled-components';

export interface SkeletonAvatarProps extends SkeletonNodeProps {
  size?: number;
}
export const StyledSkeletonAvatar = styled(SkeletonAvatar)<SkeletonAvatarProps>`

&.ant-skeleton > .ant-skeleton-image {
  height: ${({ size = 40  }) => `${size}px`};
  width: ${({ size = 40  }) => `${size}px`};
  line-height: ${({ size = 40 }) => `${size}px`};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.palette.secondary.light};
}
`;

export const StyledSkeletonInput = styled(SkeletonInput)<SkeletonInputProps>`
&.ant-skeleton {
  display: flex;
}

&.ant-skeleton .ant-skeleton-input {
  flex-grow: 0.97;
  background-color: ${({ theme }) => theme.palette.secondary.light};
  // border-radius: 50%;
}
`;
