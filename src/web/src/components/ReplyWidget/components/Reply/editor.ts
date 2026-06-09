
import { useState } from "react";
import { useReply, useReplyEditor } from "../..";

export interface EditorManager {
    isLoading: boolean;
    isOpened: boolean;
    open: () => void;
    close: () => void;

    text: string;
    onChange: (value: string) => void;
    submit: () => Promise<void>;
}

export const useEditor = (): EditorManager => {
    const { reply } = useReply();

    const { isLoading, edit } = useReplyEditor();

    const [text, setText] = useState(reply.text);
    const [isOpened, setIsOpened] = useState(false);

    const open = () => setIsOpened(true);

    const close = () => {
        setIsOpened(false);
        setText(origin);
    }

    const onChange = (value: string) => setText(value);

    const submit = async () => {
        await edit({ text: text, add_files: [], remove_files: [] });
        setIsOpened(false);
    }

    return { isLoading, isOpened, open, close, text, onChange, submit };
};
