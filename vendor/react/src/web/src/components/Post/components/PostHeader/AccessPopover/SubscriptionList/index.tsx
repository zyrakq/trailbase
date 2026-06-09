import { usePost } from "@/components/Post";
import { useSubscriptionTypeListLoader } from "@/components/SubscriptionTypeList";
import { useMemo } from "react";
import { StyledItem } from "./styles";

export const SubscriptionList = () => {
  const {
    data: { subscription_types },
  } = usePost();

  const { list } = useSubscriptionTypeListLoader();

  const subscriptions = useMemo(
    () => list.filter((x) => subscription_types.includes(x.uuid)),
    [list, subscription_types]
  );

  return (
    <div style={{ minWidth: 200 }}>
      <ul style={{ padding: "0 20px" }}>
        {subscriptions.map((subscription) => (
          <StyledItem key={subscription.uuid}>{subscription.title}</StyledItem>
        ))}
      </ul>
    </div>
  );
};
