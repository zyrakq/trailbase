import { FC } from "react";

import {
  Attachment,
  SentimentSatisfied,
} from "@styled-icons/material-outlined";

import { useTranslation } from "@/services/i18n";
import { Dropdown, IconButton } from "@/ui";

import {
  EditorToolbarWrapper,
  HiddenInput,
  ToolbarMenu,
  ToolbarMenuItem,
} from "./styles";
import { EditorToolbarProps } from "./types";
import { EmojiPicker } from "@/components/Post/components/EmojiPicker";

export const EditorToolbar: FC<EditorToolbarProps> = ({
  upload,
  clickEmoji,
}) => {
  const { t } = useTranslation("common");

  const menu = (
    <ToolbarMenu>
      <ToolbarMenuItem>
        <label htmlFor="imageUpload">
          <HiddenInput
            accept="image/*"
            id="imageUpload"
            type="file"
            onChange={upload}
          />
          <span> {t("photo")} </span>
        </label>
      </ToolbarMenuItem>

      <ToolbarMenuItem>
        <label htmlFor="videoUpload">
          <HiddenInput
            accept="video/*"
            id="videoUpload"
            type="file"
            onChange={upload}
          />
          <span> {t("video")} </span>
        </label>
      </ToolbarMenuItem>

      <ToolbarMenuItem>
        <label htmlFor="fileUpload">
          <HiddenInput id="fileUpload" type="file" onChange={upload} />
          <span> {t("document")} </span>
        </label>
      </ToolbarMenuItem>
    </ToolbarMenu>
  );

  return (
    <EditorToolbarWrapper>
      <Dropdown dropdownRender={() => <>{menu}</>} placement="bottomRight">
        <IconButton>
          <Attachment size={22} />
        </IconButton>
      </Dropdown>
      <Dropdown
        dropdownRender={() => <EmojiPicker onEmojiClick={clickEmoji} />}
        placement="bottomRight"
      >
        <IconButton>
          <SentimentSatisfied size={22} />
        </IconButton>
      </Dropdown>
    </EditorToolbarWrapper>
  );
};
