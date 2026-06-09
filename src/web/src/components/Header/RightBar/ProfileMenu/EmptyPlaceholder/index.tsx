import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { ExpandMore } from "@styled-icons/material-outlined";
import { Image } from "@styled-icons/icomoon";
import { StyledMenuWrapper } from "./styles";
import { SkeletonAvatar } from "@/ui";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <StyledMenuWrapper>
          <SkeletonAvatar style={{ verticalAlign: "middle" }} active>
            <Image style={{ color: "white" }} size={16} />
          </SkeletonAvatar>
          <ExpandMore size={24} />
        </StyledMenuWrapper>
      )}
    </>
  );
};
