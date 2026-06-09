import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Title, Text } from "@/ui";

import { FollowerCounterContainer, FollowerCounterWrapper } from "./styles";
import { getCountType } from "@/utils/translate";

export const FollowerCounter: FC<{ count: number }> = ({ count }) => {
  const { t } = useTranslation("common");

  return (
    <FollowerCounterWrapper>
      {count !== 0 && (
        <FollowerCounterContainer>
          <Title variant="h2" color="secondary" style={{ marginBottom: 0 }}>
            {count}
          </Title>
          <Text>
            {t("profile.followers_interval", {
              postProcess: "interval",
              count: getCountType(count),
            })}
          </Text>
        </FollowerCounterContainer>
      )}
    </FollowerCounterWrapper>
  );
};
