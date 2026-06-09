import { useTranslation } from "@/services/i18n";
import { Popover, Text } from "@/ui";
import { LockOpen } from "@styled-icons/material-outlined";
import { useMemo, useState } from "react";
import { SubscriptionList } from "./SubscriptionList";
import { usePost } from "@/components/Post";

export const AccessPopover = () => {
  const { t } = useTranslation("common");

  const {
    data: { access_type },
  } = usePost();

  const [open, setOpen] = useState<boolean>(false);

  const onOpenChange = () => {
    if (
      access_type === "subscription" ||
      access_type === "one-time_or_subscription"
    ) {
      setOpen((prev) => !prev);
    }
  };

  const accessTypeText = useMemo(() => {
    switch (access_type) {
      case "one-time_or_subscription":
        return t("subscription_types.available.one-time_or_subscription");
      case "subscription":
        return t("subscription_types.available.subscribers_only");
      case "one-time":
        return t("subscription_types.available.payment_only");
      default:
        return t("subscription_types.available.everyone");
    }
  }, [access_type, t]);

  return (
    <>
      <Popover
        placement="bottomLeft"
        arrow={false}
        align={{ offset: [0, 10] }}
        content={<SubscriptionList />}
        onOpenChange={onOpenChange}
        open={open}
      >
        <Text>
          <LockOpen style={{ marginTop: -5, marginRight: 5 }} size={18} />
          {accessTypeText}
        </Text>
      </Popover>
    </>
  );
};
