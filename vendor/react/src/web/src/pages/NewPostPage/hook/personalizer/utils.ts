import { ElementTypes, ParagraphElement, CustomText } from '@/components/PostEditor/types';
import { Descendant } from 'slate';
import { DescendantDraft } from './types';
import { v4 } from 'uuid';

const initText: Descendant[] = [
    {
      type: ElementTypes.paragraph,
      align: 'justify',
      children: [{ text: '' }],
    } as Descendant,
];

export const isInit = (text: Descendant[]) => {
    if(text.length === 1){
        const paragraph = text[0] as ParagraphElement;
        if(paragraph.children.length === 1) return (paragraph.children[0] as CustomText).text === '';
    }
    return false;
}


export const init = () => {
    return {
        uuid: v4(),
        text: initText,
        files: [],
        teaser: "",
        preview: "",
        access_type: "public",
        subscription_types: [],
        created_at: "",
        updated_at: ""
    } as DescendantDraft;
}
