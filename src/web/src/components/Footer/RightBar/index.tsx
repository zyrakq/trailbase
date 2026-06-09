import { FC, memo } from "react";
import { useTranslation } from "@/services/i18n";
import { RightBarWrapper } from "./styles";
import { Link } from "@/ui";

export const RightBar: FC = memo(() => {
  const { t } = useTranslation("common");

  const list = [
    { tag: "footer.our_blog", url: "/argiago" },
    { tag: "footer.terms_of_use", url: "#" },
    { tag: "footer.privacy_policy", url: "#" },
    { tag: "footer.support", url: "#" },
  ];

  return (
    <RightBarWrapper>
      <ul style={{ display: "flex", margin: 0 }}>
        {list.map((x) => (
          <li key={x.tag} style={{ listStyleType: "none", marginLeft: 12 }}>
            <Link variant="dashed" color="secondary" href={x.url}>
              {t(x.tag)}
            </Link>
          </li>
        ))}
      </ul>
    </RightBarWrapper>
  );
});
