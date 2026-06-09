import {
  FormDivider,
  StyledContainer,
  StyledFormItem,
  StyledPaper,
} from "./styles";
import { useTranslation } from "@/services/i18n";
import { useDraftPersonalizer } from "@/pages/NewPostPage";
import { PostEditor } from "@/components/PostEditor";
import { Title } from "@/ui";

export const Editor = () => {
  const { t } = useTranslation("common");

  const {
    data: { text },
    onChange,
  } = useDraftPersonalizer();

  return (
    <>
      <Title
        variant="h1"
        style={{ fontWeight: 500, padding: "5px 0" }}
        color="secondary"
      >
        {t("new_post.title")}
      </Title>
      <StyledPaper>
        <StyledContainer>
          <StyledFormItem>
            <Title
              style={{ paddingBottom: 24 }}
              variant="h4"
              color="secondary"
              textTransform="uppercase"
            >
              {t("new_post.sections.post")}
            </Title>
            <PostEditor value={text} onChange={onChange} />
          </StyledFormItem>
        </StyledContainer>
        <FormDivider />
      </StyledPaper>
    </>
  );
};
