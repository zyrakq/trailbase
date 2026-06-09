import { FC } from "react";
import { useAvatar, useProfile } from "@/services/profile";
import { UserAvatar } from "@/components/UserAvatar";

export const InputAvatar: FC = () => {
  const { user, isSuccess } = useProfile();

  const { isLoading } = useAvatar();

  return (
    <div style={{ margin: "3px 15px 0 0" }}>
      <UserAvatar
        shape={"circle"}
        size={40}
        picture={user.picture}
        username={user.username}
        isLoading={isLoading || !isSuccess}
      />
    </div>
  );
};
