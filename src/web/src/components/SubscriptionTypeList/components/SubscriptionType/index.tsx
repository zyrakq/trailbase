import { FC, useMemo } from "react";
import { SubscriptionTypeProps } from "./types";
import { Title, Text, Button } from "@/ui";
import { StyledImage, StyledWidget } from "./styles";
import { useTranslation } from "@/services/i18n";
import { useRate } from "@/components/SubscriptionTypeList/provider";
import { useUserCurrencyChooser } from "@/services/profile";

export const SubscriptionType: FC<SubscriptionTypeProps> = ({
  subscription_type: { title, amount, picture, description },
}) => {
  const { t } = useTranslation();

  const { userCurrency } = useUserCurrencyChooser();

  const { getAmount } = useRate();

  const symbol = useMemo(() => userCurrency.symbol, [userCurrency.symbol]);

  const amountInCurrency = useMemo(
    () => getAmount(amount),
    [amount, getAmount]
  );

  return (
    <>
      <StyledWidget>
        <Title variant="h3" color="secondary">
          {title}
        </Title>
        <Text style={{ margin: "0 0 10px 0" }}>
          {`${amount} BTC ${t("subscription_types.per_month")}`}
          {` (~${amountInCurrency} ${symbol})`}
        </Text>
        <StyledImage src={picture} preview={false} height={170} />
        <Text style={{ margin: "15px 0" }} color="secondary">
          {description}
        </Text>
        <Button>{t("subscription_types.button.subscribe")}</Button>
      </StyledWidget>
    </>
  );
};
