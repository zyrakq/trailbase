import { FC } from "react";
import { Button } from "@/ui";
import { useTranslation } from "@/services/i18n";
import { NotepadEdit } from "@styled-icons/fluentui-system-regular";
import { useNavigate } from "react-router-dom";
import { useAuthor } from "@/components/AuthorSecure";

export const NewPostWidget: FC = () => {
  const navigate = useNavigate();

  const { t } = useTranslation("common");

  const {
    author: { username },
    isCurrentUser,
  } = useAuthor();

  return (
    <>
      {isCurrentUser && (
        <Button block onClick={() => navigate(`/${username}/new-post/`)}>
          <NotepadEdit style={{ marginRight: 10 }} size={22} />
          {t("profile.write_post")}
        </Button>
      )}
    </>
  );
};
