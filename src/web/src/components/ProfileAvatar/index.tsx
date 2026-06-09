import { FC } from "react";
import { AvatarEditor } from "./AvatarEditor";
import { PhotoCropper } from "./PhotoCropper";
import { PhotoDropper } from "./PhotoDropper";
import { usePhotoDropper } from "./PhotoDropper/state";
import { usePhotoCropper } from "./PhotoCropper/state";
import { useAvatar, useProfile } from "@/services/profile";
import { UserAvatar } from "@/components/UserAvatar";

export const ProfileAvatar: FC = () => {
  const { user } = useProfile();

  const { isLoading } = useAvatar();

  const {
    opened: dropperOpened,
    open: openDropper,
    close: closeDropper,
    submit: submitDropper,
  } = usePhotoDropper();

  const {
    cropperRef,
    opened: cropperOpened,
    open: openCropper,
    close: closeCropper,
    attachment,
    attach,
    submit: submitCropper,
  } = usePhotoCropper();

  return (
    <UserAvatar
      shape="square"
      size={259}
      picture={user.picture}
      username={user.username}
      isLoading={isLoading}
      preview={true}
    >
      <PhotoDropper
        open={dropperOpened}
        close={closeDropper}
        submit={submitDropper}
      />
      <PhotoCropper
        cropperRef={cropperRef}
        close={closeCropper}
        open={cropperOpened}
        attachment={attachment}
        attach={attach}
        submit={submitCropper}
      />
      <AvatarEditor
        remove={openDropper}
        edit={openCropper}
        filled={!!user.picture}
      />
    </UserAvatar>
  );
};
