import { useCallback, useMemo, useState } from 'react';
import { useProfile } from '@/services/profile';
import { become_author } from './fake';


export interface BecomeAuthorManager {
  isLoading: boolean;
  becomeAuthor: () => Promise<void>;
}


export const useBecomeAuthor = (): BecomeAuthorManager => {

  const [isLoadingAuthorState, setIsLoadingAuthorState] = useState<boolean>(false);

  const { user: { username, is_author }, isLoading: isLoadingProfile, isSuccess: isSuccessProfile, refresh } = useProfile();

  const isLoading = useMemo(
    () => (isLoadingAuthorState || (isLoadingProfile && !isSuccessProfile)),
    [isLoadingAuthorState, isLoadingProfile, isSuccessProfile]
  );

  const becomeAuthor = useCallback(async () => {
    if(!is_author){
      setIsLoadingAuthorState(true);
      await become_author(username);

      await refresh();
      setIsLoadingAuthorState(false);
    }
  }, [username, is_author, setIsLoadingAuthorState, refresh]);


  return { isLoading, becomeAuthor };
};
