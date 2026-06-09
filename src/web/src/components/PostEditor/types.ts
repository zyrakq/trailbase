import { Descendant, BaseEditor, Range, Element } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export enum ElementTypes {
  block_quote = 'block_quote',
  bulleted_list = 'bulleted_list',
  numbered_list = 'numbered_list',
  heading_one = 'heading_one',
  heading_two = 'heading_two',
  paragraph = 'paragraph',
  left = 'left',
  center = 'center',
  right = 'right',
  justify = 'justify'
}

export type BlockElementTypes = 
  ElementTypes.numbered_list
  | ElementTypes.bulleted_list
  | ElementTypes.paragraph
  | ElementTypes.block_quote
  | ElementTypes.heading_one
  | ElementTypes.heading_two;



export type BlockQuoteElement = {
  type: ElementTypes.block_quote
  align?: string
  children: Descendant[]
}

export type BulletedListElement = {
  type: ElementTypes.bulleted_list
  align?: string
  children: Descendant[]
}

export type NumberedListElement = {
  type: ElementTypes.numbered_list
  align?: string
  children: Descendant[]
}


export type HeadingElement = {
  type: ElementTypes.heading_one
  align?: string
  children: Descendant[]
}

export type HeadingTwoElement = {
  type: ElementTypes.heading_two
  align?: string
  children: Descendant[]
}

export type ParagraphElement = {
  type: ElementTypes.paragraph
  align?: string
  children: Descendant[]
}

export type CustomElement =
  | BlockQuoteElement
  | BulletedListElement
  | NumberedListElement
  | HeadingElement
  | HeadingTwoElement
  | ParagraphElement

export type CustomText = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  text: string
}

export type CustomEditor = BaseEditor &
  ReactEditor &
  HistoryEditor & {
    nodeToDecorations?: Map<Element, Range[]>
}