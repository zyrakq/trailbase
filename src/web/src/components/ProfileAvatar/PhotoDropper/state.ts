import { useState } from 'react';
import { PhotoDropperManager } from './types';
import { useAvatar } from '@/services/profile';
import { useTranslation } from '@/services/i18n';
import { useAlert } from '@/utils/alert';


export const usePhotoDropper = (): PhotoDropperManager => {

  const { t } = useTranslation('common');
  const { success, error } = useAlert();

  const [ opened, setOpened ] = useState<boolean>(false);

  const { deleteAvatar } = useAvatar();

  const open = () => {
    setOpened(true);
  };

  const close = () => {
    setOpened(false);
  };

  const submit = async () => {
    try {
      await deleteAvatar();
      close();

      success(t('avatar.deleted'));
    }
    catch(_err) {
      error(t('something_went_wrong'));
    }
  };


  return { opened, open, close, submit };
};
