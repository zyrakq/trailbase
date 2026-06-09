import { FC } from 'react';

import {
  ProfileInfoPaper,
  StyledAvatarContainer,
} from './styles';
import { AuthorAvatar } from './AuthorAvatar';
import { FollowersBar } from './FollowersBar';


export const CardWidget: FC = () => {
  return (
    <ProfileInfoPaper>
      <StyledAvatarContainer>
        <AuthorAvatar />
        <FollowersBar />
      </StyledAvatarContainer>
    </ProfileInfoPaper>
  );
};
