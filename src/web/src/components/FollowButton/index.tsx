import { useAuthor, useSubscribedAuthor } from "@/components/AuthorSecure";
import { useTranslation } from "@/services/i18n";
import { Button } from "@/ui/Button";
import { PersonAdd, PersonAvailable } from "@/ui";
import { useState } from "react";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export const FollowButton = () => {
  const { t } = useTranslation("common");

  const { isFollowed, isSubscribed } = useAuthor();

  const { isLoading, follow, stopFollowing } = useSubscribedAuthor();

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <EmptyPlaceholder condition={!isLoading}>
      {isFollowed && (
        <Button
          block
          color="primary"
          variant="outlined"
          textTransform="none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={isSubscribed}
          onClick={async () => {
            await stopFollowing();
          }}
        >
          {isHovered ? (
            t("profile.stop_following")
          ) : (
            <>
              <PersonAvailable size={26} disabled={isSubscribed} />
              {t("profile.following")}
            </>
          )}
        </Button>
      )}
      {!isFollowed && (
        <Button
          block
          color="primary"
          variant="outlined"
          textTransform="none"
          onClick={async () => {
            await follow();
          }}
        >
          <PersonAdd size={26} />
          {t("profile.follow")}
        </Button>
      )}
    </EmptyPlaceholder>
  );
};
