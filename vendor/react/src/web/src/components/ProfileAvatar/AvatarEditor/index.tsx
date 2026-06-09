import { FC } from "react";

import { Delete, Refresh } from "@styled-icons/material-outlined";

import { useTranslation } from "@/services/i18n";

import { Action, ActionList, AvatarEditActionsWrapper } from "./styles";
import { Divider } from "antd";

type AvatarEditActionsProps = {
  filled: boolean;
  edit: () => void;
  remove?: () => void;
};

export const AvatarEditor: FC<AvatarEditActionsProps> = ({
  filled,
  edit,
  remove,
}) => {
  const { t } = useTranslation("common");
  return (
    <AvatarEditActionsWrapper>
      <ActionList>
        <Action onClick={edit}>
          <Refresh size={20} />
          <div>{t(filled ? "avatar.edit" : "avatar.upload")}</div>
        </Action>
        {filled && (
          <>
            <Divider />
            <Action onClick={remove}>
              <Delete size={20} />
              <div>{t("avatar.delete")}</div>
            </Action>
          </>
        )}
      </ActionList>
    </AvatarEditActionsWrapper>
  );
};
