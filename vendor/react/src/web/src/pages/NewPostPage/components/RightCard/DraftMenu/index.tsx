import { FC } from "react";
import { useTranslation } from "@/services/i18n";
import { Dropdown, Menu, MenuItem, Text } from "@/ui";
import { StyledMenuWrapper, TrashButton } from "./styles";
import { ExpandMore } from "@styled-icons/material-outlined";
import { Trash } from "@styled-icons/boxicons-regular";
import {
  Draft,
  useDraftChanger,
  useDraftChooser,
  useDraftList,
  useDraftPersonalizer,
} from "@/pages/NewPostPage";
import { getCountType } from "@/utils/translate";

export const DraftMenu: FC = () => {
  const { t } = useTranslation("common");

  const { list, count } = useDraftList();

  const {
    data: { uuid },
  } = useDraftPersonalizer();

  const { remove } = useDraftChanger();

  const { choose } = useDraftChooser();

  const menuItems = list.map((item: Draft) => {
    const name = `${item.created_at} - ${
      item.updated_at === item.created_at ? "..." : item.updated_at
    }`;
    return (
      <MenuItem key={item.uuid}>
        <div style={{ display: "flex", justifyContent: "start" }}>
          <TrashButton
            color="secondary"
            onClick={async () => await remove(item.uuid)}
          >
            <Trash size={18} />
          </TrashButton>
          <span style={{ marginTop: 2 }}>{name}</span>
        </div>
      </MenuItem>
    );
  });

  const onChoose = ({ key }: { key: string }) => {
    choose(key);
  };

  const menu = () => (
    <Menu style={{ minWidth: 306 }} selectedKeys={[uuid]} onClick={onChoose}>
      {menuItems}
    </Menu>
  );

  return (
    <div style={{ display: "flex", justifyContent: "end" }}>
      <Dropdown
        dropdownRender={() => <>{menu()}</>}
        trigger={["click"]}
        align={{ offset: [2, 10] }}
        overlayStyle={{ position: "absolute" }}
        placement={"bottomRight"}
        disabled={count === 0}
      >
        <StyledMenuWrapper>
          <Text component="span" color="secondary">
            {count !== 0 ? `${count} ` : ""}
            {t("new_post.saved_drafts_interval", {
              postProcess: "interval",
              count: getCountType(count),
            })}
            <ExpandMore size={24} />
          </Text>
        </StyledMenuWrapper>
      </Dropdown>
    </div>
  );
};
