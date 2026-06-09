import { FC, memo } from 'react';
import { LanguageMenu } from './LanguageMenu';
import { ProfileMenu } from './ProfileMenu';
import { RightBarWrapper, SpaceWrapper } from './styles';
import { BecomeToAuthor } from './BecomeToAuthor';

export const RightBar: FC = memo(() => {
  return (
    <RightBarWrapper>
      <BecomeToAuthor />
      <SpaceWrapper>
        <LanguageMenu />
        <ProfileMenu />
      </SpaceWrapper>
    </RightBarWrapper>
  );
});
