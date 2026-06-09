import { Descendant } from "slate";
import { PostAccessType } from "@/pages/NewPostPage";


export interface DescendantDraft {
    uuid: string,
    text: Descendant[];
    teaser: string;
    files: string[];
    preview: string;
    access_type: PostAccessType;
    subscription_types: string[];
    created_at: string;
    updated_at: string;
}


export interface DraftPersonalizerManager {
    data: DescendantDraft;
    isInitial: boolean;
    onChange: (value: Descendant[]) => void;
}
