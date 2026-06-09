import { Menu } from "@styled-icons/boxicons-regular";
import { List } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/services/i18n";
import { useSubscribedUser } from "@/services/profile";
import { Button, Drawer } from "@/ui";
import { SubscribedUser } from "./SubscribedUser";
import { StyledListItem } from "./styles";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export const SubscriptionBar: FC = () => {
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const { list, isLoading } = useSubscribedUser();

  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const drawer = document.querySelector(".ant-drawer");
      const target = event.target as Node;

      if (
        drawer &&
        !drawer.contains(target) &&
        (!btnRef.current || !btnRef.current.contains(event.target as Node))
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const showDrawer = () => {
    setOpen((prev) => !prev);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        ref={btnRef}
        style={{ marginRight: 15, width: 270 }}
        block
        startIcon={<Menu size={22} />}
        variant="outlined"
        onClick={showDrawer}
      >
        {t("header.my_subscriptions")}
      </Button>
      <Drawer
        mask={false}
        placement={"left"}
        closable={false}
        onClose={onClose}
        open={open}
        key={"left"}
      >
        <EmptyPlaceholder condition={!isLoading}>
          {list.length > 0 && (
            <List
              dataSource={list}
              renderItem={(item) => (
                <StyledListItem>
                  <SubscribedUser
                    username={item.username}
                    picture={item.picture}
                  />
                </StyledListItem>
              )}
            />
          )}
        </EmptyPlaceholder>
      </Drawer>
    </>
  );
};
