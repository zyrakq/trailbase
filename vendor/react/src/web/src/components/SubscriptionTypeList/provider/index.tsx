import { FC } from "react";
import { SubscriptionTypeListLoaderProvider } from "./loader";
import { useAuthor } from "@/components/AuthorSecure";
import { RateProvider } from "./rate";

export type {
  SubscriptionTypeListLoaderManager,
  SubscriptionTypeModel,
} from "./loader";
export {
  LoadingStatus,
  SubscriptionTypeListLoaderProvider,
  useSubscriptionTypeListLoader,
} from "./loader";

export type { RateManager } from "./rate";
export { RateProvider, useRate } from "./rate";

export const SubscriptionTypeListProvider: FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    author: { sub },
  } = useAuthor();

  return (
    <SubscriptionTypeListLoaderProvider sub={sub}>
      <RateProvider>{children}</RateProvider>
    </SubscriptionTypeListLoaderProvider>
  );
};
