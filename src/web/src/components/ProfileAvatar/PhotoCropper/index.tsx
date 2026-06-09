import { FC } from "react";

import { ConfirmFormButtonBar } from "@/components/ConfirmFormButtonBar";
import { useTranslation } from "@/services/i18n";
import { Form, FormItem, Modal } from "@/ui";

import { CropperWrapper, FormContent } from "./styles";
import { PhotoCropperProps } from "./types";
import { ImageUploadBox } from "./ImageUploadBox";

import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

export const PhotoCropper: FC<PhotoCropperProps> = ({
  cropperRef,
  open,
  close,
  attachment,
  attach,
  submit,
}) => {
  const { t } = useTranslation("common");

  return (
    <Modal
      centered
      destroyOnClose
      closable={false}
      footer={null}
      title={attachment ? t("avatar.thumb_selection") : t("avatar.upload")}
      open={open}
    >
      <Form layout="vertical" onFinish={submit}>
        <FormItem>
          {attachment ? (
            <FormContent>
              <CropperWrapper>
                <Cropper
                  checkOrientation
                  responsive
                  aspectRatio={1}
                  dragMode="move"
                  guides={false}
                  initialAspectRatio={1}
                  minCropBoxHeight={150}
                  minCropBoxWidth={150}
                  preview=".img-preview"
                  ref={cropperRef}
                  src={attachment}
                  style={{ height: 308, width: 308, borderRadius: "8px" }}
                  viewMode={3}
                />
              </CropperWrapper>
            </FormContent>
          ) : (
            <ImageUploadBox
              text={t("avatar.drag")}
              onAttach={(file: File) => attach(file)}
            />
          )}
        </FormItem>
        <ConfirmFormButtonBar
          handleCancel={close}
          submitText={t("actions.save")}
        />
      </Form>
    </Modal>
  );
};
