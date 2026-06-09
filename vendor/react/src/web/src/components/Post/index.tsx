import { Spin } from "antd";
import { FC } from "react";
import { PostContent } from "./components/PostContent";
import { PostHeader } from "./components/PostHeader";
import { PostContextProvider } from "./provider";
import { PostMain, WallItem } from "./styles";
import { CommentListProvider } from "@/components/CommentList";
import { PostFooter } from "./components/PostFooter";
import { PostModel } from "@/components/PostList";

export { usePost } from "./provider";
export type { PostManager } from "./provider";

export interface PostProps {
  data: PostModel;
  render?: () => void;
}

export const Post: FC<PostProps> = ({ data, render }) => {
  return (
    <PostContextProvider data={data} render={render}>
      <div>
        <Spin spinning={false}>
          <WallItem>
            <PostMain>
              <PostHeader />

              <PostContent />
              <CommentListProvider uuid={data.uuid} render={render}>
                <PostFooter />
              </CommentListProvider>
            </PostMain>
          </WallItem>
        </Spin>
      </div>
    </PostContextProvider>
  );
};
