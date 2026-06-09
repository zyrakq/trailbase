
import { useCallback } from 'react';
import { useMutation } from "@tanstack/react-query";

import { useProfile } from '@/services/profile';

import { DescendantDraft, useDraftPersonalizer } from "@/pages/NewPostPage";
import { AdditionalInfo, PostSenderManager } from './types';
import { createPost } from './fake';

export type { PostSenderManager } from './types';

export const usePostSender = (): PostSenderManager => {

  const { user: { sub } } = useProfile();

  const { data } = useDraftPersonalizer();


  const { mutateAsync: mutateSendAsync, isPending: isLoading } = useMutation({
    mutationFn: async ({ data, additional }: { data: DescendantDraft, additional: AdditionalInfo }) => {
      const { uuid } = await createPost({ data, additional });

      //await removeDraft();

      return { uuid };
    }
  });

  const send = useCallback(async () => {
    const additional = { sub };

    return await mutateSendAsync({ data, additional });

  }, [data, sub, mutateSendAsync]);

  return { isLoading, send };
};
