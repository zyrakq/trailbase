import AntSelect, { SelectProps, SelectValue } from 'antd/lib/select';
import { StyledSelectDropdownWrapper, StyledWrapper } from './styles';
import { CSSProperties, useTheme } from 'styled-components';

export type { SelectProps, OptionProps } from 'antd/lib/select';


export const Select = <T extends SelectValue>(props: SelectProps<T>) => {

  const theme = useTheme();
  
  const newStyle = {
    color: `${theme.palette.gray[50]}`,
    backgroundColor: `${theme.palette.background.paper}`,
    border: `solid 1px ${theme.palette.secondary.light}`,
    borderRadius: 4,
    userSelect: 'none',
  } as CSSProperties;

  const { dropdownStyle, dropdownRender } = props;
  return (
    <StyledWrapper>
      <AntSelect {...props}
      dropdownStyle={{...newStyle, ...dropdownStyle }}
      dropdownRender={(menu) => (
        <StyledSelectDropdownWrapper>
          {dropdownRender && (dropdownRender(menu))}
          {!dropdownRender && menu}
        </StyledSelectDropdownWrapper>
      )}
      />
    </StyledWrapper>
  );
};

export const { Option } = AntSelect;
export const { OptGroup: OptionGroup } = AntSelect;
