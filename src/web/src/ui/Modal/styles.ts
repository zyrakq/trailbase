import { Modal } from 'antd';
import styled from 'styled-components';

export const StyledModal = styled(Modal)`
  .ant-modal-content {
    border: solid 1px ${({ theme }) => theme.palette.secondary.light};
    background: ${({ theme }) => theme.palette.secondary.contrastText};
    border-radius: 8px;
  }
  .ant-modal {
    border-radius: 8px;
  }
  .ant-modal-header {
    border-radius: 8px;
  }

  .ant-modal-title {
    font-weight: 700;
    font-size: 20px;
    line-height: 28px;
    color: ${({ theme }) => theme.palette.secondary.dark};
    background: ${({ theme }) => theme.palette.secondary.contrastText};
  }
`;