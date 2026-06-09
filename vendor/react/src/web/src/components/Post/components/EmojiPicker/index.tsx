import { FC } from 'react';

import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

import { EmojiPickerWrapper } from './styles';
import { EmojiPickerProps } from './types';

export const EmojiPicker: FC<EmojiPickerProps> = ({
  onEmojiClick,
  setIsEmojiVisible,
  className = '',
}) => {
  const hideEmojiPicker = () => {
    setTimeout(() => setIsEmojiVisible?.(false), 300);
  };

  return (
    <EmojiPickerWrapper
      withoutPositioning
      className={`emoji-picker_wrapper ${className}`}
      onMouseLeave={hideEmojiPicker}
    >
      <Picker
        data={data}
        emojiSize={20}
        onEmojiSelect={onEmojiClick}
      />
    </EmojiPickerWrapper>
  );
};
