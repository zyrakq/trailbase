import { FC, memo } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { ChevronsLeft } from "@styled-icons/boxicons-regular";
import { ManageAccounts } from "@styled-icons/material-outlined";

import { useTranslation } from "@/services/i18n";
import { Title, MenuButton } from "@/ui";

import { NavMenu, NavMenuItem, NavMenuLink, StyledWidget } from "./styles";

export const AccountSettingsPanelWrapper: FC = memo(() => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = location.pathname.split("/").pop();
  const hasPreviousState = location.key !== "default";

  return (
    <>
      <MenuButton
        style={{ padding: "16px" }}
        onClick={() => (hasPreviousState ? navigate(-1) : navigate("/"))}
      >
        <ChevronsLeft size={22} />
        {t("actions.back")}
      </MenuButton>
      <StyledWidget>
        <Title variant="h2" color="secondary">
          {t("account_settings_page.label")}
        </Title>
        <NavMenu selectedKeys={[`${activeKey}`]}>
          <NavMenuItem key="settings">
            <NavMenuLink to="/settings">
              <ManageAccounts color="primary" size={22} />
              {t("account_settings_page.profile")}
            </NavMenuLink>
          </NavMenuItem>
          {/* <NavMenuItem key="settings">
            <NavMenuLink to="/notifications/settings">
              <Settings color="primary" size={22} />
              {t('settings')}
            </NavMenuLink>
          </NavMenuItem> */}
        </NavMenu>
      </StyledWidget>
    </>
  );
});
