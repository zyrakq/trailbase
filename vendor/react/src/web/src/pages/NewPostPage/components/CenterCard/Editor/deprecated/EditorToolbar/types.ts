import { ChangeEvent } from 'react';
import { Emoji } from 'emoji-mart';

export type EditorToolbarProps = {
  upload: (e: ChangeEvent<HTMLInputElement>) => void;
  clickEmoji: (emoji: Emoji) => void;
};
