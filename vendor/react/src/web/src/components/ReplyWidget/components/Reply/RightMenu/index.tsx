import { FC, useEffect, useMemo, useState } from "react";

import {
  Edit,
  ExpandMore,
  OutlinedFlag,
} from "@styled-icons/material-outlined";
import { useTranslation } from "@/services/i18n";
import { Dropdown, IconButton, Menu } from "@/ui";

import { ExpandMoreButton, StyledMenuItem, TrashButton } from "./styles";
import { useProfile } from "@/services/profile";
import { Trash } from "@styled-icons/boxicons-regular";

export type RightMenuProps = {
  sub: string;
  visibility: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onReport?: () => Promise<void>;
};
export const RightMenu: FC<RightMenuProps> = ({
  sub,
  visibility,
  onEdit,
  onDelete,
  onReport,
}) => {
  const { t } = useTranslation("common");

  const {
    user: { sub: currentSub },
    isSuccess,
  } = useProfile();

  const isCurrentUser = useMemo(
    () => isSuccess && sub === currentSub,
    [sub, isSuccess, currentSub]
  );

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visibility) setVisible(false);
  }, [visibility, setVisible]);

  return (
    <>
      {isCurrentUser && (
        <>
          <IconButton
            disabled={!visibility}
            color="secondary"
            style={{ width: 25, visibility: visibility ? "initial" : "hidden" }}
            onClick={onEdit}
          >
            <Edit size={18} />
          </IconButton>
          <TrashButton
            disabled={!visibility}
            color="secondary"
            style={{ width: 25, visibility: visibility ? "initial" : "hidden" }}
            edge="right"
            onClick={onDelete}
          >
            <Trash size={18} />
          </TrashButton>
        </>
      )}
      {!isCurrentUser && (
        <Dropdown
          open={visible && visibility}
          onOpenChange={setVisible}
          disabled={!visibility}
          overlayStyle={{ position: "absolute" }}
          dropdownRender={() => (
            <Menu>
              <StyledMenuItem key="comment_report" onClick={onReport}>
                <OutlinedFlag size={22} />
                {t("actions.report")}
              </StyledMenuItem>
            </Menu>
          )}
          placement="bottomRight"
          trigger={["click"]}
        >
          <ExpandMoreButton
            color="secondary"
            style={{ visibility: visibility ? "initial" : "hidden" }}
            edge="right"
            disabled={!visibility}
          >
            <ExpandMore size={24} />
          </ExpandMoreButton>
        </Dropdown>
      )}
    </>
  );
};
