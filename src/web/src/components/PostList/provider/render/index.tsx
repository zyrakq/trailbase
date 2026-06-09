import { PostListRenderManager } from './types';
import {
    FC,
    RefObject,
    createContext,
    createRef,
    useCallback,
    useContext,
    useRef,
  } from 'react';
import { CellMeasurerCache, List } from 'react-virtualized';

export type { PostListRenderManager } from './types';


export const usePostListRenderManager = ():PostListRenderManager => {

  const ref: RefObject<List> = createRef();

  const cache = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 1164,
      minHeight: 300
    }),
  );

  const rowRender = useCallback((rowIndex: number) => {
    return () => {
      cache.current.clear(rowIndex, 0);
      ref.current?.recomputeRowHeights(rowIndex);
    };
  }, [ref, cache]);

  return { ref, cache, rowRender };
};

const PostListRenderContext = createContext<PostListRenderManager>({
  ref: {} as RefObject<List>,
  cache: {} as React.MutableRefObject<CellMeasurerCache>,
  rowRender: {} as (rowIndex: number) => () => void,
});

export const usePostListRender = () => {
  const context = useContext(PostListRenderContext);

  if (!context) {
    throw new Error('usePostListRender must be used within PostListRenderContext');
  }
  return context;
};
  
  
  
export const PostListRenderProvider: FC<{ children: React.ReactNode }> = ({ children }) => {

  const value: PostListRenderManager = usePostListRenderManager();

  return (
    <PostListRenderContext.Provider value={value}>
      {children}
    </PostListRenderContext.Provider>
  );
};
  