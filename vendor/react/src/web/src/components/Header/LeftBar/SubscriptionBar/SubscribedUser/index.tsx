import { FC } from "react";
import { getPhoto, getMonogram } from "@/utils/avatar";
import { Avatar, Link } from "@/ui";
import { useNavigate } from "react-router-dom";

export interface SubscribedUserProps {
  username: string;
  picture?: string;
}

export const SubscribedUser: FC<SubscribedUserProps> = ({
  username,
  picture,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <Avatar
        style={{ marginRight: 10 }}
        shape={"circle"}
        size={40}
        src={getPhoto(picture)}
      >
        {getMonogram(username)}
      </Avatar>
      <Link
        variant="text"
        color="secondary"
        onClick={() => navigate(`/${username}`)}
      >
        {username}
      </Link>
    </>
  );
};
