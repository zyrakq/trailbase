import { FC } from "react";
import { useAvatar, useProfile } from "@/services/profile";
import { StyledMenuWrapper } from "./styles";
import { UserAvatar } from "@/components/UserAvatar";
import { ExpandMore } from "@styled-icons/material-outlined";

export const DefaultProfileMenu: FC = () => {
  const { user, isSuccess } = useProfile();
  const { isLoading } = useAvatar();
  return (
    <StyledMenuWrapper>
      <UserAvatar
        shape="circle"
        size={40}
        picture={user.picture}
        username={user.username}
        isLoading={isLoading || !isSuccess}
      />
      <ExpandMore size={24} />
    </StyledMenuWrapper>
  );
};
