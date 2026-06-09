import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Button } from "@/ui";
import { useBecomeAuthor } from "./hook";
import { useProfile } from "@/services/profile";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export { useBecomeAuthor } from "./hook";

export const BecomeToAuthor: FC = () => {
  const {
    user: { is_author },
    isSuccess,
  } = useProfile();

  const { t } = useTranslation();

  const { isLoading, becomeAuthor } = useBecomeAuthor();

  return (
    <EmptyPlaceholder condition={!isLoading}>
      {isSuccess && !is_author && (
        <Button
          block
          style={{ width: 270 }}
          variant="outlined"
          onClick={() => becomeAuthor()}
        >
          {t("header.become_author")}
        </Button>
      )}
    </EmptyPlaceholder>
  );
};
