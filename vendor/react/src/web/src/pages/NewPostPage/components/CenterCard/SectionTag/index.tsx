import { useTranslation } from "@/services/i18n";
import { Input, Title } from "@/ui";
import { StyledPaper, StyledTag } from "./styles";

export const SectionTag = () => {
  const { t } = useTranslation("common");

  return (
    <>
      <StyledPaper>
        <Title
          style={{ paddingBottom: 12 }}
          variant="h4"
          color="secondary"
          textTransform="uppercase"
        >
          {t("new_post.sections.tags.title")}
        </Title>
        <Input
          placeholder={t("new_post.sections.tags.placeholder")}
          size="large"
          allowClear
        />
        <div style={{ paddingTop: 20 }}>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
          <StyledTag closable>fgdgfdfgdg</StyledTag>
        </div>
      </StyledPaper>
    </>
  );
};
