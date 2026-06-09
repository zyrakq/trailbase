import { FC } from 'react';

import { StyledModal } from './styles';
import { ModalProps } from 'antd';

export const Modal: FC<ModalProps> = ({ ...props }) => {
  return (
    <StyledModal {...props}>
    </StyledModal>
  );
};