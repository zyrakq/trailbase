import { useCommentCreator } from "@/components/CommentFormWidget/provider";
import { useState } from "react";

export interface CreatorManager {
    text: string;
    onChange: (value: string) => void;
    submit: () => Promise<void>;
    render?: () => void;
}

export const useCreator = (): CreatorManager => {

    const { create, render } = useCommentCreator();

    const [text, setText] = useState('');

    const onChange = (value: string) => setText(value);

    const submit = async() => {
        if (text.trim() !== '') {
            await create({
              text,
              files: [],
              reply_uuid: "",
              parent_uuid: "",
            })
            setText('');
        }
    }

    return { text, onChange, submit, render };
};
