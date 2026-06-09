import { useRef, useState } from 'react';
import { PhotoCropperManager } from './types';
import { ReactCropperElement } from 'react-cropper';
import { useTranslation } from '@/services/i18n';
import { useAlert } from '@/utils/alert';
import { useAvatar } from '@/services/profile';


export const usePhotoCropper = (): PhotoCropperManager => {

  const { t } = useTranslation('common');
  const { success, error } = useAlert();

  const cropperRef = useRef<ReactCropperElement>(null);

  const [attachment, setAttachment] = useState<string | undefined>();

  const [ opened, setOpened ] = useState<boolean>(false);

  const { saveAvatar } = useAvatar();

  const open = () => {
    setOpened(true);
  };

  const close = () => {
    setOpened(false);
    setAttachment(undefined);
    cropperRef?.current?.cropper.destroy();
  };

  const attach = (file: File) => {
    setAttachment(URL.createObjectURL(file));
  };

  const submit = async () => {
    const cropper = cropperRef?.current?.cropper;
    const canvas = cropper?.getCroppedCanvas();

    canvas?.toBlob(async (blob) => {
      if (blob) {
        try {
          await saveAvatar(blob);
          close();

          success(t('avatar.uploaded'));
        }
        catch(_err) {
          error(t('something_went_wrong'));
        }
      }
    }, 'image/jpeg');
  };


  return { cropperRef, opened, open, close, attachment, attach, submit };
};
