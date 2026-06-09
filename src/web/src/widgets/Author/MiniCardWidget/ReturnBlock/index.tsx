import { useAuthor } from "@/components/AuthorSecure";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/services/i18n";
import { Button } from "@/ui";
import { ArrowBack } from "@styled-icons/boxicons-regular";

export const ReturnBlock: FC = () => {
  const navigate = useNavigate();

  const { t } = useTranslation("common");

  const {
    author: { username },
  } = useAuthor();

  return (
    <>
      <Button
        style={{
          marginTop: 16,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
        block
        onClick={() => navigate(`/${username}`)}
      >
        <ArrowBack style={{ margin: "0 7px 0 0" }} size={16} />
        <span>{t("Перейти в блог")}</span>
      </Button>
    </>
  );
};
