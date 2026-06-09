import { useTranslation } from "@/services/i18n";
import { ArrowBack } from "@styled-icons/boxicons-regular";
import { Link } from "@/ui";
import { useLocation, useNavigate } from "react-router-dom";

export const BackLink = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const hasPreviousState = location.key !== "default";

  const { t } = useTranslation("common");

  return (
    <Link
      variant="dashed"
      style={{ padding: 10 }}
      onClick={() => (hasPreviousState ? navigate(-1) : navigate("/"))}
    >
      <ArrowBack style={{ padding: "0 5px 2px 0" }} size={20} />
      {t("actions.back")}
    </Link>
  );
};
