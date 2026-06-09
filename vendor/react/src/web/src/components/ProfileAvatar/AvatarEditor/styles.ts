import styled from 'styled-components';

export const AvatarEditActionsWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #2e2e32;
  border-radius: 8px;
  opacity: 0;
  display: flex;
  justify-content: center;
  white-space: nowrap;
  align-content: center;
  z-index: 1;
  align-items: center;
  transition: opacity 0.8s ease-in-out;
  position: absolute;
  :hover {
    opacity: 0.65;
  }
  .ant-divider-horizontal {
    margin: 16px 0 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

export const ActionList = styled.div`
  max-width: 200px;
  display: flex;
  flex-direction: column;
`;

export const Action = styled.button`
  display: flex;
  // flex-direction: column;
  align-items: center;
  justify-content: start;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
  color: white;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;

  div {
    white-space: break-spaces;
    line-height: 1.2;
  }
`;
