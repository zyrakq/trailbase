import { useComment, useCommentRemover } from "@/components/CommentWidget";
import { useMemo, } from "react";

export interface RemoverManager {
    isLoading: boolean;
    isDeleted: boolean;
    isRecoverable: boolean;
    restore: () => Promise<void>;
    remove: () => Promise<void>;
}

export const useRemover = (): RemoverManager => {

    const { comment } = useComment();

    const { restore: restoreComment, remove: removeComment, isLoading } = useCommentRemover();

    const restore = async () => {
        await restoreComment();

    };

    const remove = async () => {
        await removeComment();
    };

    const isDeleted = useMemo(() => !!comment.deleted_at, [comment]);
    const isRecoverable = useMemo(() => true, []);

    return { isLoading, isDeleted, isRecoverable, restore, remove };
};
