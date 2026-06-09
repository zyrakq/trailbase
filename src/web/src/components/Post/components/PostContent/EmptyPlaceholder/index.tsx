import { FC } from "react";
import { usePost } from "@/components/Post";
import { useTranslation } from "@/services/i18n";
import { Button, Image, Text } from "@/ui";
import { LockOpen } from "@styled-icons/material-outlined";
import {
  ContainerWrapper,
  SunscriptionTypeText,
  TeaserContainer,
} from "./styles";
import { EmptyPlaceholderProps } from "./types";
import { getPreviewWithFallback } from "@/utils/photo";
import { useTheme } from "styled-components";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  const {
    data: { preview, teaser, access_type },
  } = usePost();

  const { t } = useTranslation("common");

  const theme = useTheme();

  return (
    <>
      {condition ? (
        children
      ) : (
        <div style={{ position: "relative", width: "630px", height: "685px" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Image
              style={{
                filter: !!teaser ? "brightness(80%)" : "brightness(100%)",
              }} // Здесь настраиваем уровень затемнения с помощью filter: brightness()
              src={getPreviewWithFallback(theme.palette.type, preview)}
              preview={false}
              height={685}
              width={630}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: !!teaser
                  ? "rgba(0, 0, 0, 0.2)"
                  : "rgba(0, 0, 0, 0)", // Здесь задаем цвет и прозрачность затемнения
              }}
            />
          </div>

          <TeaserContainer>
            <Text component="span" color="secondary">
              {teaser}
            </Text>
          </TeaserContainer>
          <ContainerWrapper>
            {access_type === "one-time" && (
              <>
                <SunscriptionTypeText color="secondary">
                  {t("subscription_types.after_purchase")}:
                </SunscriptionTypeText>
                <Button style={{ marginTop: 10 }}>
                  {t("subscription_types.button.buy")}
                </Button>
              </>
            )}
            {access_type === "subscription" && (
              <>
                <SunscriptionTypeText color="secondary">
                  {t("subscription_types.required")}:
                </SunscriptionTypeText>
                <Button style={{ marginTop: 10 }}>
                  {t("subscription_types.button.subscribe")}
                </Button>
              </>
            )}
            {access_type === "one-time_or_subscription" && (
              <>
                <SunscriptionTypeText color="secondary">
                  {t("subscription_types.required")}:
                </SunscriptionTypeText>
                <Button style={{ marginTop: 10 }}>
                  <LockOpen style={{ marginRight: 8 }} size={20} />
                  {t("subscription_types.button.unlock_post")}
                </Button>
              </>
            )}
          </ContainerWrapper>
        </div>
      )}
    </>
  );
};
