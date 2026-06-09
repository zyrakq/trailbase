
export interface EditCommentModel {
    text: string;
    add_files: string[];
    remove_files: string[];
}
export interface AdditionalInfo {
    list_uuid: string;
    updated_at: string;
}

export interface CommentEditorManager {
    isLoading: boolean;
    isSuccess: boolean;
    edit: (data: EditCommentModel) => Promise<void>;
}
