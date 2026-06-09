import { FC, useEffect } from "react";
import { Post } from "@/components/Post";
import { useReceivedPost } from "@/components/ReceivedPost/provider";
import { LoadingStatus } from "@/components/ReceivedPost/provider/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui";
import { ArrowBack } from "@styled-icons/boxicons-regular";
import { useAuthor } from "@/components/AuthorSecure";
import { useTranslation } from "@/services/i18n";

export { ReceivedPostProvider } from "./provider";

export const ReceivedPost: FC = () => {
  const navigate = useNavigate();

  const { t } = useTranslation("common");

  const {
    author: { username },
  } = useAuthor();

  const { post, status } = useReceivedPost();

  useEffect(() => {
    if (status === LoadingStatus.NotFound) navigate("/404");
  }, [status, navigate]);

  return (
    <>
      {status === LoadingStatus.Loaded && (
        <>
          <Post data={post} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              textTransform="none"
              style={{
                padding: 20,
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 100,
              }}
              onClick={() => navigate(`/${username}`)}
            >
              <ArrowBack style={{ margin: "0 7px 0 0" }} size={16} />
              <span>{t("Перейти ко всем постам")}</span>
            </Button>
          </div>
        </>
      )}
    </>
  );
};
