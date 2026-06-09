import { FC } from 'react';
import { BasePostListProvider } from './loader';
import { PostListRenderProvider } from './render';

export { usePostList, usePostListInfiniteLoader, usePostListLoader } from './loader';
export { usePostListRender } from './render';

export type { PostListManager, PostListInfiniteLoader, PostListLoader, PostModel } from './loader';
export type { PostListRenderManager } from './render';

export const PostListProvider: FC<{ sub: string, children: React.ReactNode }> = ({ sub, children }) => {

  return (
    <PostListRenderProvider>
      <BasePostListProvider sub={sub}>
        {children}
      </BasePostListProvider>
    </PostListRenderProvider>
  );
};
  