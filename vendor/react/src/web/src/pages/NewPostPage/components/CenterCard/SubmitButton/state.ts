import { useAuthor } from '@/components/AuthorSecure';
import { usePostSender } from '@/pages/NewPostPage';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/services/i18n';
import { useAlert } from '@/utils/alert';

export interface NewPostEditorManager {
  submit: () => Promise<void>;
}


export const useNewPostEditor = (): NewPostEditorManager => {

  const navigate = useNavigate();

  const { t } = useTranslation('common');

  const { success, error } = useAlert();

  const { author: { username } } = useAuthor();

  const { send } = usePostSender();

  const submit = useCallback(async () => {

    try {
      await send();
      success(t('new_post.created'));
      navigate(`/${username}`)
    }
    catch(_err) {
      error(t('something_went_wrong'));
    }
  }, [username, send, navigate, success, error, t]);


  return { submit };
};
