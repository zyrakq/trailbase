import { useOidc } from "@axa-fr/react-oidc";
import {
  FC,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { get_post } from "./fake";
import { LoadingStatus, ReceivedPostManager } from "./types";
import { useAuthor } from "@/components/AuthorSecure";
import { PostModel } from "@/components/PostList";

const useReceivedPostManager = (uuid: string): ReceivedPostManager => {
  const [post, setPost] = useState<PostModel>({} as PostModel);
  const [status, setStatus] = useState<LoadingStatus>(
    LoadingStatus.NotInitialized
  );

  const { isAuthenticated } = useOidc();

  const { author, isSuccess: isSuccessAuthor } = useAuthor();

  const upload = useCallback(
    async (uuid: string) => {
      if (isSuccessAuthor) {
        setStatus(LoadingStatus.Loading);
        const additional = { sub: author.sub };
        const result = await get_post(
          isAuthenticated ? "private" : "public",
          uuid,
          additional
        );
        if (result.status === LoadingStatus.Loaded) {
          setPost(result.post);
        }
        setStatus(result.status);
      }
    },
    [isAuthenticated, author.sub, isSuccessAuthor, setPost, setStatus]
  );

  useEffect(() => {
    upload(uuid);
  }, [uuid, upload]);

  return { post, status };
};

const ReceivedPostContext = createContext<ReceivedPostManager | null>(null);

export const useReceivedPost = () => {
  const context = useContext(ReceivedPostContext);

  if (!context) {
    throw new Error("useReceivedPost must be used within ReceivedPostContext");
  }
  return context;
};

export const ReceivedPostProvider: FC<{
  uuid: string;
  children: React.ReactNode;
}> = ({ uuid, children }) => {
  const value = useReceivedPostManager(uuid);

  return (
    <ReceivedPostContext.Provider value={value}>
      {children}
    </ReceivedPostContext.Provider>
  );
};
