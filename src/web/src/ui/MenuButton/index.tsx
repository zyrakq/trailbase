import styled from 'styled-components';

export const MenuButton = styled.a`
  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: none;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-radius: 8px;
  margin: 0 0 16px 0;
  font-family: Open Sans;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.palette.text.secondary};
  background: ${({ theme }) => theme.palette.background.paper};
  & > svg {
    margin-right: 8px;
  }

  &:hover {
    color: ${({ theme }) => theme.palette.primary.light};
  }
`;