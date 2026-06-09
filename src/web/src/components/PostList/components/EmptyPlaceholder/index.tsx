import { FC } from "react";

import noPosts from "@/assets/post/starred-empty.svg";
import { useTranslation } from "@/services/i18n";
import { EmptyBoxBig, Title, Text } from "@/ui";

import { PlaceholderDescription, PlaceholderPaper } from "./styles";
import { EmptyPlaceholderProps } from "./types";
import { useAuthor } from "@/components/AuthorSecure";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  const { t } = useTranslation("common");

  const { isCurrentUser } = useAuthor();

  return (
    <>
      {condition ? (
        children
      ) : (
        <PlaceholderPaper>
          <EmptyBoxBig
            description={
              <PlaceholderDescription>
                <Title variant="h2">{t("post_list.placeholder.title")}</Title>
                {isCurrentUser && (
                  <Text component="span" color="secondary">
                    {t("post_list.placeholder.description")}
                  </Text>
                )}
              </PlaceholderDescription>
            }
            image={noPosts}
          />
        </PlaceholderPaper>
      )}
    </>
  );
};
