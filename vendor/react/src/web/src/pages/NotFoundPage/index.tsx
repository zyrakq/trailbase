import { FC } from "react";

import { useNavigate } from "react-router-dom";
import { ConfirmFormButtonBar } from "@/components/ConfirmFormButtonBar";
import { useTranslation } from "@/services/i18n";
import { Text, Title } from "@/ui";

import {
  CentredButtonContainer,
  ResultBodyWrapper,
  PlaceholderPaper,
} from "./styles";
import { Result } from "antd";

export const NotFoundPage: FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };
  const handleGoToMain = () => {
    navigate("/");
  };
  const { t } = useTranslation("common");
  return (
    <PlaceholderPaper>
      <Result
        status="404"
        extra={
          <ResultBodyWrapper>
            <Title variant="h2">{`${t("not_found_page.title")}`}</Title>
            <Text component="span" color="secondary">
              {t("not_found_page.description")}
            </Text>
            <CentredButtonContainer>
              <ConfirmFormButtonBar
                cancelText={t("actions.back")}
                handleCancel={handleGoBack}
                handleSubmit={handleGoToMain}
                submitText={t("actions.to_main")}
              />
            </CentredButtonContainer>
          </ResultBodyWrapper>
        }
      />
    </PlaceholderPaper>
  );
};
