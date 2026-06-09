import { FC, useCallback, useMemo, useState } from "react";
import { usePost } from "@/components/Post/provider";
import { ContainerHider } from "./ContainerHider";
import { useTranslation } from "@/services/i18n";
import { Link } from "@/ui";

export const ContainerCropper: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation("common");

  const height = 630;

  const { render } = usePost();

  const [textHeight, setTextHeight] = useState(0);

  const onChangeHeight = useCallback(
    (offsetHeight: number) => {
      setTextHeight(offsetHeight);
    },
    [setTextHeight]
  );

  const [open, setOpen] = useState(false);

  const isCropening = useMemo(() => textHeight >= height, [textHeight]);

  const isExpanded = useMemo(() => !isCropening || open, [isCropening, open]);

  const handleReadMore = () => {
    setOpen(true);
    if (render) render();
  };

  return (
    <>
      <ContainerHider
        height={height}
        onChangeHeight={onChangeHeight}
        isExpanded={isExpanded}
      >
        {children}
      </ContainerHider>
      {!isExpanded && (
        <div style={{ paddingTop: 31 }}>
          <Link variant="dashed" onClick={handleReadMore}>
            {t("post_list.show_more")}
          </Link>
        </div>
      )}
    </>
  );
};
