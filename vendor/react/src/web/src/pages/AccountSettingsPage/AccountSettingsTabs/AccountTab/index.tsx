import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Paper, Title } from "@/ui";
import { Col, Row } from "antd";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { CurrencySelect } from "@/components/CurrencySelect";

export const AccountTab: FC = () => {
  const { t } = useTranslation("common");

  return (
    <Paper style={{ padding: "2px 0" }}>
      <Row justify="space-between">
        <Col>
          <Title variant="h1" color="secondary">
            {t("account_settings_page.profile")}
          </Title>
        </Col>
      </Row>
      <Row>
        <div>
          <Title variant="h4" color="secondary">
            {t("Фотография профиля")}
          </Title>
          <ProfileAvatar />
        </div>
      </Row>
      <Row>
        <CurrencySelect />
      </Row>
    </Paper>
  );
};
