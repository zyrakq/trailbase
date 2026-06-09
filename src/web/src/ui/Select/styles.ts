import { colord } from 'colord';
import styled from 'styled-components';

export const StyledWrapper =  styled.div`
  .ant-select-single {
    & .ant-select-selector {
        border-radius: 8px;
        # height: 40px;
        # padding: 5px 11px;

        color: ${({ theme }) => theme.palette.secondary.dark};
        border-color: ${({ theme }) => theme.palette.secondary.light};
        background-color: ${({ theme }) => theme.palette.background.paper};

        .ant-select-selection-placeholder {
            color: ${({ theme }) => theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main};
        }
    }
  }
  & .ant-select-disabled.ant-select .ant-select-selector {
    color: ${({ theme }) => theme.palette.text.disabled} !important;
  }
  & .ant-select-focused.ant-select .ant-select-selector {
    border-color: ${({ theme }) => theme.palette.primary.light} !important;
  }
  & .ant-select {
    &:focus .ant-select-selector, &:hover .ant-select-selector, &:active .ant-select-selector {
        border-color: ${({ theme }) => theme.palette.primary.light} !important;
        box-shadow: none;
    }
    & .ant-select-arrow {
        color: ${({ theme }) => theme.palette.type === 'light' ? theme.palette.gray[200] : theme.palette.secondary.main};
    }
  }
`;



export const StyledSelectDropdownWrapper = styled.div`
& .ant-select-item {
    color: ${({ theme }) => theme.palette.text.secondary};
}

& .ant-select-item-option:hover, .ant-select-item-option:active, .ant-select-item-option:focus {
    color: ${({ theme }) => theme.palette.type === "light" ?
        theme.palette.primary.dark
        : theme.palette.primary.contrastText
    } !important;
    background-color:  ${({ theme })  => theme.palette.type === "light" ?
        colord(theme.palette.primary.main).alpha(0.1).toHslString()
        : colord(theme.palette.primary.main).alpha(0.9).toHslString()
    } !important;
}

& .ant-select-item-option-selected {
    color: ${({ theme }) => theme.palette.type === "light" ?
        theme.palette.primary.dark
        : theme.palette.primary.contrastText
    } !important;
    background-color:  ${({ theme })  => theme.palette.type === "light" ?
        colord(theme.palette.primary.main).alpha(0.1).toHslString()
        : colord(theme.palette.primary.main).alpha(0.9).toHslString()
    } !important;
}

`;