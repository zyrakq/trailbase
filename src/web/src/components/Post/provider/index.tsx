import { FC, createContext, useContext, useMemo } from "react";
import { PostManager } from "./types";
import { PostModel } from "@/components/PostList";

export type { PostManager } from "./types";

export const PostContext = createContext<PostManager | null>(null);

export const usePost = () => {
  const context = useContext(PostContext);

  if (!context) {
    throw new Error("usePost must be used within PostContext");
  }
  return context;
};

export interface PostContextProviderProps {
  data: PostModel;
  render?: () => void;
  children: React.ReactNode;
}

export const PostContextProvider: FC<PostContextProviderProps> = ({
  data,
  render,
  children,
}) => {
  const value = useMemo(() => data, [data]);

  return (
    <PostContext.Provider value={{ data: value, render }}>
      {children}
    </PostContext.Provider>
  );
};
