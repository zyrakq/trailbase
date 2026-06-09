export interface PostListInfiniteLoader {
    loadMoreRows: ({ startIndex, stopIndex }: { startIndex: number, stopIndex: number}) => Promise<void>;
}

export interface PostListLoader {
    load: () => Promise<{ isSuccess: boolean }>;
}