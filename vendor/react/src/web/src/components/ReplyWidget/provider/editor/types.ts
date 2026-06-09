
export interface EditReplyModel {
    text: string;
    add_files: string[];
    remove_files: string[];
}
export interface AdditionalInfo {
    source_uuid: string;
    list_uuid: string;
    updated_at: string;
}

export interface ReplyEditorManager {
    isLoading: boolean;
    isSuccess: boolean;
    edit: (data: EditReplyModel) => Promise<void>;
}
