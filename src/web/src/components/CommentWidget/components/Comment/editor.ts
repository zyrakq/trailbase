import { useComment, useCommentEditor } from "@/components/CommentWidget";
import { useState } from "react";

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
    const { comment } = useComment();

    const { isLoading, edit } = useCommentEditor();

    const [text, setText] = useState(comment.text);
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
