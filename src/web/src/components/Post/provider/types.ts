import { PostModel } from "@/components/PostList";

export interface PostManager {
    data: PostModel;
    render?: () => void,
}
