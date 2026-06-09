import { FC } from "react";
import { useAuthor } from "@/components/AuthorSecure";
import { PostListProvider } from "@/components/PostList/provider";
import { PostList } from "@/components/PostList";

export const PostListWidget: FC = () => {
  const {
    author: { sub },
    isSuccess,
  } = useAuthor();

  return (
    <>
      {isSuccess && (
        <PostListProvider sub={sub}>
          <PostList />
        </PostListProvider>
      )}
    </>
  );
};
