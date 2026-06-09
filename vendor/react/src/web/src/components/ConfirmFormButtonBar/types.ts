import { MouseEventHandler } from 'react';

export type ConfirmFormButtonBarProps = {
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  handleSubmit?: MouseEventHandler<HTMLButtonElement>;
  handleCancel?: MouseEventHandler<HTMLButtonElement>;
  mode?: 'submit' | 'cancel';
  reverse?: boolean;
  submitText?: string;
  cancelText?: string;
};
