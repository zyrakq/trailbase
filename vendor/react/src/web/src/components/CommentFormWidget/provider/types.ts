export interface CreateCommentModel {
    text: string;
    files: string[];
    reply_uuid: string;
    parent_uuid: string;
}

export interface AdditionalInfo {
    source_uuid: string;
    sub: string,
    username: string,
    picture: string | undefined
}

export interface CommentCreatorManager {
    isPending: boolean;
    isSuccess: boolean;
    create: (data: CreateCommentModel) => Promise<void>;
}
