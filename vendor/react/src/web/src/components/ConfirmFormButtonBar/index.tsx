import { FC } from "react";

import { useTranslation } from "@/services/i18n";

import { ButtonsWrapper, ResetButton, SubmitButton } from "./styles";
import { ConfirmFormButtonBarProps } from "./types";
import { Divider } from "antd";

export const ConfirmFormButtonBar: FC<ConfirmFormButtonBarProps> = ({
  submitText,
  cancelText,
  mode,
  reverse,
  handleCancel,
  handleSubmit,
  submitDisabled,
  cancelDisabled,
}) => {
  const { t } = useTranslation("common");

  const cancelButton = (!mode || mode === "cancel") && (
    <ResetButton
      variant="outlined"
      disabled={cancelDisabled}
      type="reset"
      onClick={handleCancel}
    >
      {cancelText ?? t("actions.cancel")}
    </ResetButton>
  );

  const submitButton = (!mode || mode === "submit") && (
    <SubmitButton
      disabled={submitDisabled}
      type="submit"
      onClick={handleSubmit}
    >
      {submitText ?? t("actions.save")}
    </SubmitButton>
  );

  return (
    <ButtonsWrapper>
      {reverse ? (
        <>
          {submitButton}
          <Divider type="vertical" />
          {cancelButton}
        </>
      ) : (
        <>
          {cancelButton}
          <Divider type="vertical" />
          {submitButton}
        </>
      )}
    </ButtonsWrapper>
  );
};
