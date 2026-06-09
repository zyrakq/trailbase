import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { Image } from "@styled-icons/icomoon";
import { SkeletonAvatar } from "@/ui";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  shape,
  size = 40,
  children,
}) => {
  const imageSize = size >= 250 ? 64 : size > 40 ? 32 : 16;
  return (
    <>
      {condition ? (
        children
      ) : (
        <SkeletonAvatar
          style={{
            verticalAlign: "middle",
            borderRadius: shape === "circle" ? "50%" : "8px",
          }}
          active
          size={size}
        >
          <Image style={{ color: "white" }} size={imageSize} />
        </SkeletonAvatar>
      )}
    </>
  );
};
