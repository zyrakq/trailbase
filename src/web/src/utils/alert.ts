import { message as alertMessage } from 'antd';

export const useAlert = () => {
  const warning = (message: string) =>
    alertMessage.warning({ content: message, duration: 2 });

  const error = (message: string) =>
    alertMessage.error({ content: message, duration: 2 });

  const success = (message: string) =>
    alertMessage.success({ content: message, duration: 2 });

  return {
    success,
    warning,
    error,
  };
};
