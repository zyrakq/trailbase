import { Emoji } from 'emoji-mart';

export type EmojiPickerProps = {
  onEmojiClick: (emoji: Emoji) => void;
  setIsEmojiVisible?: (state: boolean) => void;
  className?: string;
};

export interface EmoEmojiPickerWrapperProps {
  withoutPositioning?: boolean;
}
