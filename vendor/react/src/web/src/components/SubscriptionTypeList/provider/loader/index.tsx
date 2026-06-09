import { useOidc } from "@axa-fr/react-oidc";
import {
  FC,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { get_subscription_type_list } from "./fake";
import {
  LoadingStatus,
  SubscriptionTypeListLoaderManager,
  SubscriptionTypeModel,
} from "./types";
import { useProfile } from "@/services/profile";

export type {
  SubscriptionTypeListLoaderManager,
  SubscriptionTypeModel,
} from "./types";
export { LoadingStatus } from "./types";

const useSubscriptionTypeListLoaderManager = (
  sub: string
): SubscriptionTypeListLoaderManager => {
  const [list, setList] = useState<SubscriptionTypeModel[]>([]);
  const [status, setStatus] = useState<LoadingStatus>(
    LoadingStatus.NotInitialized
  );

  const { isAuthenticated } = useOidc();

  const {
    user: { sub: profileSub },
  } = useProfile();

  const upload = useCallback(
    async (sub: string) => {
      setStatus(LoadingStatus.Loading);
      // const additional = { currentUserSub: oidcUser.sub };
      const result = await get_subscription_type_list(
        isAuthenticated ? "private" : "public",
        sub
        // additional
      );
      if (result.status === LoadingStatus.Loaded) {
        setList(result.list);
      }
      setStatus(result.status);
    },
    [isAuthenticated, profileSub, setList, setStatus]
  );

  useEffect(() => {
    if (sub) upload(sub);
  }, [sub, upload]);

  return { list, status };
};

const SubscriptionTypeListLoaderContext =
  createContext<SubscriptionTypeListLoaderManager | null>(null);

export const useSubscriptionTypeListLoader = () => {
  const context = useContext(SubscriptionTypeListLoaderContext);

  if (!context) {
    throw new Error(
      "useSubscriptionTypeListLoader must be used within SubscriptionTypeListLoaderContext"
    );
  }
  return context;
};

export const SubscriptionTypeListLoaderProvider: FC<{
  sub: string;
  children: React.ReactNode;
}> = ({ sub, children }) => {
  const value = useSubscriptionTypeListLoaderManager(sub);

  return (
    <SubscriptionTypeListLoaderContext.Provider value={value}>
      {children}
    </SubscriptionTypeListLoaderContext.Provider>
  );
};
