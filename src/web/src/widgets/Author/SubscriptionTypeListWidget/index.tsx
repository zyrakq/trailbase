import { SubscriptionTypeListProvider } from "@/components/SubscriptionTypeList";
import { FC, ReactNode } from "react";

export const SubscriptionTypeListWidget: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <SubscriptionTypeListProvider>{children}</SubscriptionTypeListProvider>
    </>
  );
};
