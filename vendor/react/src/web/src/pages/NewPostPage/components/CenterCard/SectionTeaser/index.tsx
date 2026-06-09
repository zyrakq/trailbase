import { useTranslation } from "@/services/i18n";
import { Title, Text, Button, InputTextArea } from "@/ui";
import { StyledPaper } from "./styles";
import { Image } from "@styled-icons/icomoon";

export const SectionTeaser = () => {
  const { t } = useTranslation("common");

  return (
    <>
      <StyledPaper>
        <Title variant="h4" color="secondary" textTransform="uppercase">
          {t("new_post.sections.teaser")}
        </Title>
        <Text>
          Тизер показывается только для пользователей, не имеющих доступа к
          вашему посту.
        </Text>
        <Button
          startIcon={<Image size={16} />}
          style={{ margin: "15px 0" }}
          variant="outlined"
        >
          Добавить обложку
        </Button>
        <Text>PNG, JPG не более 30 Mb.</Text>
        <InputTextArea
          style={{ resize: "none", margin: "15px 0" }}
          placeholder={t("Начните писать тизер")}
          showCount
          maxLength={140}
          rows={4}
        />
      </StyledPaper>
    </>
  );
};
