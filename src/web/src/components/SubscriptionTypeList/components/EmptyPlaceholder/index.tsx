import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { EmptyBox, Text } from "@/ui";
import { useTranslation } from "@/services/i18n";

import emptySvg from "@/assets/subscription/multi-editor-no-changes-empty.svg";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  const { t } = useTranslation("common");

  return (
    <>
      {condition ? (
        children
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 150,
          }}
        >
          <EmptyBox
            description={
              <Text
                style={{ marginTop: 15, fontSize: 16 }}
                component="p"
                color="secondary"
              >
                {t("subscription_types.placeholder")}
              </Text>
            }
            image={emptySvg}
          />
        </div>
      )}
    </>
  );
};
