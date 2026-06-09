import { FC } from "react";

import { ExpandMore } from "@styled-icons/material-outlined";
import { GlobeSurface } from "@styled-icons/fluentui-system-regular";

import {
  langDataMaps,
  useTranslation,
  useLanguage,
  Language,
  LanguageData,
} from "@/services/i18n";
import { Dropdown, Menu, MenuItem, Text } from "@/ui";

import { MenuImg, StyledMenuWrapper } from "./styles";
import { Col, Row } from "antd";

enum LanguageName {
  en = "EN",
  ru = "RU",
}

export const LanguageMenu: FC = () => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useLanguage();

  const changeLang = ({ key }: { key: string }) => {
    changeLanguage(key as Language);
  };

  const menuItems = langDataMaps.map((item: LanguageData) => {
    return (
      <MenuItem key={item.name} style={{ marginLeft: -6 }}>
        <MenuImg alt={t("header.lang.label")} src={item.flag.toString()} />
        {item.name.toUpperCase()}
      </MenuItem>
    );
  });

  const menu = () => (
    <Menu selectedKeys={[i18n.language]} onClick={changeLang}>
      {menuItems}
    </Menu>
  );

  return (
    <Row
      style={{ flexGrow: 0.3, marginRight: 20 }}
      gutter={[4, 4]}
      wrap={false}
    >
      <Col>
        <GlobeSurface size={26} />
      </Col>
      <Col>
        <Dropdown
          dropdownRender={() => <>{menu()}</>}
          trigger={["click"]}
          align={{ offset: [-3, 7] }}
          placement={"bottomRight"}
        >
          <StyledMenuWrapper>
            <Text component="span" color="secondary">
              {LanguageName[i18n.language as Language]}
              <ExpandMore size={24} />
            </Text>
          </StyledMenuWrapper>
        </Dropdown>
      </Col>
    </Row>
  );
};
