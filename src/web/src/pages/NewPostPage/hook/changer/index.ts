import { DraftChangerManager } from './types';
import { useCallback } from 'react';
import { removeDraft, saveDraft } from './fake';
import { useMutation } from "@tanstack/react-query";
import { useProfile } from '@/services/profile';
import { useDraftList, useDraftPersonalizer } from '@/pages/NewPostPage';

export type { DraftChangerManager } from './types';

export const useDraftChanger = (): DraftChangerManager => {

  const { user: { sub } } = useProfile();

  const { refresh } = useDraftList();

  const { data: draft } = useDraftPersonalizer();


  const { mutateAsync: mutateRemoveAsync } = useMutation({
    mutationFn: async (uuid: string) => {
      await removeDraft({ uuid, additional: { sub } });
      await refresh();
    }
  });

  const remove = useCallback(async (uuid: string) => {
    await mutateRemoveAsync(uuid);
  }, [mutateRemoveAsync]);



  const { mutateAsync: mutateSaveAsync } = useMutation({
    mutationFn: async () => {
      await saveDraft({ draft, additional: { sub } });
      await refresh();
    }
  });

  const save = useCallback(async () => {
    await mutateSaveAsync();
  }, [mutateSaveAsync]);

  return { remove, save };
};
