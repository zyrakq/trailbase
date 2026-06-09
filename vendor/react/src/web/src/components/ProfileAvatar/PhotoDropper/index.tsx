import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Modal } from "@/ui";
import { PhotoDropperProps } from "./types";
import { ConfirmFormButtonBar } from "@/components/ConfirmFormButtonBar";

export const PhotoDropper: FC<PhotoDropperProps> = ({
  open,
  close,
  submit,
}) => {
  const { t } = useTranslation("common");

  return (
    <Modal
      title={`${t("avatar.delete")}?`}
      open={open}
      centered
      destroyOnClose
      closable={false}
      footer={null}
    >
      <ConfirmFormButtonBar
        handleCancel={close}
        handleSubmit={submit}
        cancelText={t("actions.cancel")}
        submitText={t("actions.delete")}
      />
    </Modal>
  );
};
