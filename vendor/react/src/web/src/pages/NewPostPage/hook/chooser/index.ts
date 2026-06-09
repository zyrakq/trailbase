import { useDraftList } from '@/pages/NewPostPage';
import { DraftChooserManager } from './types';
import {
    useCallback,
  } from 'react';

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from '@/services/profile';

export type { DraftChooserManager } from './types';

export const useDraftChooser = (): DraftChooserManager => {

  const { user: { sub } } = useProfile();

  const queryClient = useQueryClient();

  const { list } = useDraftList();



  const { mutateAsync: mutateChooseAsync } = useMutation({
    mutationFn: async (uuid: string) => {
      const data = list.find(x => x.uuid === uuid);
      if (data) queryClient.setQueryData(['draft', sub], { data });
    }
  });

  const choose = useCallback(async(uuid: string) => {

    await mutateChooseAsync(uuid);

  }, [mutateChooseAsync]);


  return { choose };
};
