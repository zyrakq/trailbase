import { FC, ReactNode } from "react";
import { getPhoto } from "@/utils/avatar";
import { Avatar, AvatarPreview } from "@/ui";

import { getMonogram } from "@/utils/avatar";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { AvatarWrapper } from "./styles";

export type UserAvatarProps = {
  shape: "square" | "circle";
  size?: number;
  picture?: string;
  username?: string;
  isLoading: boolean;
  preview?: boolean;
  children?: ReactNode;
};

export const UserAvatar: FC<UserAvatarProps> = ({
  shape,
  size = 40,
  picture,
  username,
  children,
  isLoading,
  preview,
}) => {
  return (
    <EmptyPlaceholder shape={shape} size={size} condition={!isLoading}>
      <AvatarWrapper>
        {!preview || !!picture ? (
          <Avatar shape={shape} size={size} src={getPhoto(picture)}>
            {getMonogram(username)}
          </Avatar>
        ) : (
          <Avatar
            style={{ border: "none" }}
            shape={shape}
            size={size}
            icon={<AvatarPreview size={size} />}
          />
        )}
        {children}
      </AvatarWrapper>
    </EmptyPlaceholder>
  );
};
