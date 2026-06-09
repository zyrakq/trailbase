import { FC } from 'react';

import { ProfileInfoPaper, StyledAvatarContainer } from './styles';
import { AuthorAvatar } from './AuthorAvatar';
import { AuthorTitle } from './AuthorTitle';
import { FollowersBar } from './FollowersBar';
import { ReturnBlock } from './ReturnBlock';


export const MiniCardWidget: FC = () => {
  return (
    <ProfileInfoPaper>
      <StyledAvatarContainer>
        <AuthorAvatar />
        <AuthorTitle />
        <FollowersBar />
      </StyledAvatarContainer>
      <ReturnBlock />
    </ProfileInfoPaper>
  );
};
