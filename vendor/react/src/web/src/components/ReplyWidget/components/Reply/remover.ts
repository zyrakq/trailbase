import { useReply, useReplyRemover } from "../..";
import { useMemo, } from "react";

export interface RemoverManager {
    isLoading: boolean;
    isDeleted: boolean;
    isRecoverable: boolean;
    restore: () => Promise<void>;
    remove: () => Promise<void>;
}

export const useRemover = (): RemoverManager => {

    const { reply } = useReply();

    const { restore: restoreReply, remove: removeReply, isLoading } = useReplyRemover();

    const restore = async () => {
        await restoreReply();

    };

    const remove = async () => {
        await removeReply();
    };

    const isDeleted = useMemo(() => !!reply.deleted_at, [reply]);
    const isRecoverable = useMemo(() => true, []);

    return { isLoading, isDeleted, isRecoverable, restore, remove };
};
