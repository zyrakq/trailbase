import { DescendantDraft, DraftPersonalizerManager } from './types';
import {
    useCallback,
    useMemo,
  } from 'react';
import { Descendant } from 'slate';

import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from '@/services/profile';
import { init, isInit } from './utils';

export type { DraftPersonalizerManager, DescendantDraft } from './types';


export const useDraftPersonalizer = (): DraftPersonalizerManager => {

  const { user: { sub } } = useProfile();

  const queryClient = useQueryClient();

  const {
    data = {} as DescendantDraft,
  } = useSuspenseQuery({
    queryKey: ['draft', sub],
    queryFn: () => init(),
  });

  const isInitial = useMemo(() => isInit(data.text), [data.text]);



  const { mutateAsync: onMutateChangeAsync } = useMutation({
    mutationFn: async (newContent: DescendantDraft) => {
      queryClient.setQueryData(['draft', sub], { data: newContent });
    }
  });

  const onChange = useCallback(async(value: Descendant[]) => {
    const newContent = {...data, text: value };

    await onMutateChangeAsync(newContent);

  }, [data, onMutateChangeAsync]);


  return { data, isInitial, onChange };
};
