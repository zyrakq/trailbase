import { FC } from "react";

import { useAuthor } from "@/components/AuthorSecure";
import { FollowerCounter } from "./FollowerCounter";
import { FollowButton } from "@/components/FollowButton";

export const FollowersBar: FC = () => {
  const { author, isCurrentUser, isLoading } = useAuthor();

  return (
    <>
      <FollowerCounter count={author.subscribed_user_count} />
      {!isLoading && !isCurrentUser && <FollowButton />}
    </>
  );
};
