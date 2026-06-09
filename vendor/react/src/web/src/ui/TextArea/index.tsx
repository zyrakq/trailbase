import { FC, createRef, useState } from 'react';

import { StyledTextArea } from './styles';
import { TextAreaProps, TextAreaRef } from 'antd/lib/input/TextArea';

export const TextArea: FC<TextAreaProps> = (props) => {
  const { onResize, onChange: onCustomChange, ...other } = props;

  const ref = createRef<TextAreaRef>();

  const [textAreaHeight, setTextAreaHeight] = useState(0);

  const updateTextAreaHeight = () => {
    const textArea = ref.current;
    if (textArea) {
      const scrollHeight = textArea.resizableTextArea?.textArea.scrollHeight;
      if (scrollHeight && scrollHeight !== textAreaHeight) {
        setTextAreaHeight(scrollHeight);
        if(onResize) onResize({ height: 0, width: 0 });
      }
    }
  };

  const onChange = (e: any) => {
    if(onCustomChange) onCustomChange(e);
    updateTextAreaHeight();
  };
  return (
    <StyledTextArea ref={ref} {...other} onChange={onChange} />
  );
};