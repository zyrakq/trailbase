import { useCallback, useMemo } from 'react';
import { useSuspenseQuery } from "@tanstack/react-query";

import { useProfile } from '@/services/profile';

import { DraftListManager } from './types';
import { getDrafts } from './fake';

export { PostAccessType } from './types';
export type { Draft, DraftListManager } from './types';

export const useDraftList = (): DraftListManager => {

  const { user: { sub } } = useProfile();

  const {
    data: list = [],
    isLoading,
    isFetching,
    refetch
  } = useSuspenseQuery({
    queryKey: ['drafts', sub],
    queryFn: () => getDrafts({ sub }),
  });

  const count = useMemo(() => list.length, [list]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    list,
    count,
    isLoading,
    isFetching,
    refresh
  };
};
