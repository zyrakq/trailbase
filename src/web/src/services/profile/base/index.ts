import {
  useMemo,
  useCallback,
} from 'react';

import { get_user_info } from './fake';
import { UserInfo, ProfileManager } from './types';
import { useOidc, useOidcAccessToken } from '@axa-fr/react-oidc';
import { useSuspenseQuery } from "@tanstack/react-query";
import { OidcUserInfo } from '@axa-fr/react-oidc/dist/vanilla/vanillaOidc';

export type { ProfileManager, UserInfo } from './types';

interface AuthorInfo extends OidcUserInfo {
    is_author?: boolean;
    subscribed_user_count?: number;
}


export const useProfile = (): ProfileManager => {

  const { isAuthenticated, renewTokens } = useOidc();
  const { accessTokenPayload } = useOidcAccessToken();

  const payload = { ...accessTokenPayload } as AuthorInfo;

  // const isUserLoaded = useMemo(
  //   () => isAuthenticated && !!payload.sub,
  //   [isAuthenticated, payload, payload.sub]);

  const uploadUser = useCallback(async () => {
    const user: UserInfo = {
      sub: payload.sub,
      username: payload.preferred_username!,
      is_author: false,
      currency: '',
      picture: payload.picture,
    }

    if (isAuthenticated) await renewTokens();

    console.info('renewTokens');

    let newUser = await get_user_info(user);
    return newUser;
  }, [payload, renewTokens]);

  const {
    data: user = {} as UserInfo,
    isLoading,
    isSuccess,
    isFetching,
    isRefetching,
    refetch
  } = useSuspenseQuery({
    queryKey: ['user', payload.sub],
    queryFn: async() => await uploadUser(),
    // enabled: isUserLoaded,
    refetchOnMount: false
  });

  const refresh = useCallback(async () => {

    await refetch();

  }, [refetch]);

  return {
    user,
    isLoading,
    isSuccess,
    isFetching,
    isRefetching,
    refresh
  };
};
