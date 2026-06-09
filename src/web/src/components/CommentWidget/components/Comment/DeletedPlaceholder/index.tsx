import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Link, Text } from "@/ui";
import { DeletedPlaceholderProps } from "./types";

export const DeletedPlaceholder: FC<DeletedPlaceholderProps> = ({
  condition,
  isRecoverable,
  onRestore,
  children,
}) => {
  const { t } = useTranslation("common");

  return (
    <>
      {condition ? (
        children
      ) : (
        <Text component="span">
          {t("comment_list.deleted")}
          {isRecoverable && (
            <>
              {". "}
              <Link variant="dashed" onClick={onRestore}>
                {t("comment_list.restore")}
              </Link>
            </>
          )}
        </Text>
      )}
    </>
  );
};
