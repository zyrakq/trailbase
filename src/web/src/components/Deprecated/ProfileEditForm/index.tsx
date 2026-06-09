import { FC, memo } from "react";

// import { Controller, useForm } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';

// import { FormButtons } from '@/components/FormButtons';
// import { ProfileFormValues, SocialUrl, UserProfile } from 'domain/user';
// import { SocialType, SocialUrlModel } from '@/services/api';
// import { useTranslation } from '@/services/i18n';
// import { Alert, Form, FormItem, Paper, TextArea, TextField, Title } from '@/ui';
import { Paper } from "@/ui";

interface ProfileEditFormProps {
  // disabled: boolean;
  // onSubmit: (data: ProfileFormValues) => void;
  // //externalError?: Nullable<string>;
  // user: UserProfile;
}

export const ProfileEditForm: FC<ProfileEditFormProps> = memo(
  (/*{ onSubmit, externalError, user }*/) => {
    // const { t } = useTranslation('common');
    // const navigate = useNavigate();

    // const socialUrls: SocialUrl[] = useMemo(() => {
    //   return (
    //     Object.values(SocialType).filter((x) => Number.isInteger(x)) as number[]
    //   ).map((type: number) => {
    //     const userSocialUrl = user.socialUrls?.find(
    //       (s: SocialUrlModel) => s.socialType === (type as SocialType),
    //     );

    //     return {
    //       url: userSocialUrl?.url ?? '',
    //       socialType: userSocialUrl?.socialType ?? type,
    //     };
    //   });
    // }, [user.socialUrls]);

    // const { handleSubmit, formState, control } = useForm<ProfileFormValues>({
    //   defaultValues: {
    //     mobilePhone: user.mobilePhone ?? undefined,
    //     location: user.location ?? undefined,
    //     howCanHelp: user.howCanHelp ?? undefined,
    //     socialUrls,
    //   },
    // });

    return (
      <Paper style={{ padding: 24 }}>
        {/* <Title variant="h1">{t('profile_editing')}</Title>
        <Form layout="vertical">
          {externalError && (
            <FormItem>
              <Alert message={externalError} type="error" />
            </FormItem>
          )}
          <Title variant="h3">{t('common_info')}</Title>
          <Controller
            control={control}
            name="mobilePhone"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('mobile_phone')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('mobile_phone_tip')}
                />
              </FormItem>
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('location')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('location_tip')}
                />
              </FormItem>
            )}
          />
          <Controller
            control={control}
            name="howCanHelp"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('how_can_i_help')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextArea
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('how_can_help_tip')}
                />
              </FormItem>
            )}
          />
          <Title variant="h3">{t('social_networks')}</Title>
          <Controller
            control={control}
            name="socialUrls.0.url"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('VK')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('link_tip')}
                />
              </FormItem>
            )}
          />
          <Controller
            control={control}
            name="socialUrls.1.url"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('Facebook')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('link_tip')}
                />
              </FormItem>
            )}
          />
          <Controller
            control={control}
            name="socialUrls.2.url"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('Twitter')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('link_tip')}
                />
              </FormItem>
            )}
          />
          <Controller
            control={control}
            name="socialUrls.3.url"
            render={({
              field: { ref: _ref, ...fieldProps },
              fieldState: { error },
            }) => (
              <FormItem
                help={error?.message}
                label={t('Instagram')}
                validateStatus={error ? 'error' : undefined}
              >
                <TextField
                  autoComplete="off"
                  size="large"
                  {...fieldProps}
                  // TODO: to fieldProps?
                  placeholder={t('link_tip')}
                />
              </FormItem>
            )}
          />
          <FormItem style={{ marginTop: 24 }}>
            <FormButtons
              handleCancel={() => navigate('/profile')}
              handleSubmit={handleSubmit(onSubmit)}
              submitDisabled={formState.isSubmitting}
              submitText={t('save')}
            />
          </FormItem>
        </Form> */}
      </Paper>
    );
  }
);
