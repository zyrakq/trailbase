import { useTranslation } from "@/services/i18n";
import { useDraftPersonalizer } from "@/pages/NewPostPage";
import { Button } from "@/ui";
import { useNewPostEditor } from "./state";
import { StyledPaper } from "./styles";

export const SubmitButton = () => {
  const { t } = useTranslation("common");

  const { isInitial } = useDraftPersonalizer();

  const { submit } = useNewPostEditor();

  return (
    <>
      <StyledPaper>
        <Button disabled={isInitial} onClick={() => submit()}>
          {t("actions.publish")}
        </Button>
      </StyledPaper>
    </>
  );
};
