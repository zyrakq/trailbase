import { FC } from "react";
import { useAuthor } from "@/components/AuthorSecure";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export const AuthorAvatar: FC = () => {
  const { author, isCurrentUser, isLoading } = useAuthor();

  return (
    <>
      {isCurrentUser && <ProfileAvatar />}
      {!isCurrentUser && (
        <UserAvatar
          shape="square"
          size={259}
          picture={author.picture}
          username={author.username}
          isLoading={isLoading}
          preview={true}
        />
      )}
    </>
  );
};
