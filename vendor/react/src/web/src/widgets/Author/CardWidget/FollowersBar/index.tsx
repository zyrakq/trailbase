import { FC } from "react";

import { useAuthor } from "@/components/AuthorSecure";
import { FollowButton } from "@/components/FollowButton";
import { FollowerCounter } from "./FollowerCounter";

export const FollowersBar: FC = () => {
  const { author, isCurrentUser, isLoading } = useAuthor();

  return (
    <div
      style={{
        marginTop:
          !isLoading && (!isCurrentUser || author.subscribed_user_count > 0)
            ? 24
            : 0,
      }}
    >
      <FollowerCounter count={author.subscribed_user_count} />
      {!isLoading && !isCurrentUser && <FollowButton />}
    </div>
  );
};
