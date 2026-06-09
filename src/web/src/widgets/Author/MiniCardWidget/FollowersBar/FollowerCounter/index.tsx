import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Text } from "@/ui";

import { FollowerCounterWrapper } from "./styles";
import { getCountType } from "@/utils/translate";

export const FollowerCounter: FC<{ count: number }> = ({ count }) => {
  const { t } = useTranslation("common");

  return (
    <FollowerCounterWrapper>
      <Text>
        {count !== 0 ? `${count} ` : ""}
        {t("profile.followers_interval", {
          postProcess: "interval",
          count: getCountType(count),
        })}
      </Text>
    </FollowerCounterWrapper>
  );
};
