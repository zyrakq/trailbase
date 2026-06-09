import { StyledIcon } from '@styled-icons/styled-icon';
import { 
  Bold,
  Italic,
  Code,
  AlignLeft,
  AlignMiddle,
  AlignRight,
  AlignJustify
} from '@styled-icons/boxicons-regular';

import { 
  DisabledByDefault,
  FormatUnderlined,
  LooksOne,
  LooksTwo,
  FormatQuote,
  FormatListNumbered,
  FormatListBulleted
} from '@styled-icons/material-outlined';


export const iconsMap: Record<string, StyledIcon> = {
  default: DisabledByDefault,
  format_bold: Bold,
  format_italic: Italic,
  format_underlined: FormatUnderlined,
  code: Code,
  looks_one: LooksOne,
  looks_two: LooksTwo,
  format_quote: FormatQuote,
  format_list_numbered: FormatListNumbered,
  format_list_bulleted: FormatListBulleted,
  format_align_left: AlignLeft,
  format_align_center: AlignMiddle,
  format_align_right: AlignRight,
  format_align_justify: AlignJustify
};
