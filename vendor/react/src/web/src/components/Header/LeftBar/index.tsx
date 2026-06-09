import { FC, memo } from 'react';
import { LogoLink } from './LogoLink';
import { ThemeMode } from './ThemeMode';
import { SubscriptionBar } from './SubscriptionBar';
import { useOidc } from '@axa-fr/react-oidc';
import { StyledSideNavWrapper } from './styles';

export const LeftBar: FC = memo(() => {

  const { isAuthenticated } = useOidc();

  return (
    <StyledSideNavWrapper>
      <LogoLink />
          {isAuthenticated && (
              <SubscriptionBar />
          )}
          <ThemeMode />
    </StyledSideNavWrapper>
  );
});
