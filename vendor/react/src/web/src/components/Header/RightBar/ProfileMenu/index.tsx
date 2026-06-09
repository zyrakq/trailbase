import { FC } from "react";

import { useTranslation } from "react-i18next";
import { useOidc } from "@axa-fr/react-oidc";

import { AccountBox, Settings, Logout } from "@styled-icons/material-outlined";

import { Button, Dropdown, Menu, MenuItem } from "@/ui";

import { useNavigate } from "react-router-dom";
import { useProfile } from "@/services/profile";
import { DefaultProfileMenu } from "./DefaultProfileMenu";

export const ProfileMenu: FC = () => {
  const { t } = useTranslation("common");

  const { login, logout, isAuthenticated } = useOidc();
  const {
    user: { username, is_author },
    isLoading,
  } = useProfile();

  const navigate = useNavigate();

  return (
    <>
      {isLoading && <DefaultProfileMenu />}
      {!isLoading && isAuthenticated && (
        <Dropdown
          overlayStyle={{ minWidth: 178 }}
          align={{ offset: [23, 13] }}
          placement={"bottomRight"}
          trigger={["click"]}
          dropdownRender={() => (
            <Menu>
              {is_author && (
                <MenuItem
                  key="my_page"
                  onClick={() => navigate(`/${username}`)}
                >
                  <AccountBox size={24} style={{ paddingRight: "7px" }} />
                  {t("header.my_page")}
                </MenuItem>
              )}
              <MenuItem
                key="account_settings"
                onClick={() => navigate("/settings")}
              >
                <Settings size={24} style={{ paddingRight: "7px" }} />
                {t("header.account_settings")}
              </MenuItem>
              <MenuItem key="logOut" onClick={() => logout()}>
                <Logout size={24} style={{ paddingRight: "7px" }} />
                {t("header.logout")}
              </MenuItem>
            </Menu>
          )}
        >
          <div>
            <DefaultProfileMenu />
          </div>
        </Dropdown>
      )}
      {!isLoading && !isAuthenticated && (
        <Button style={{ minWidth: "180px" }} onClick={() => login()}>
          {t("header.login")}
        </Button>
      )}
    </>
  );
};
