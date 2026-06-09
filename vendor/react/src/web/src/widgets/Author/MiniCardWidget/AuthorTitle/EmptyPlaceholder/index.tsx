import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { SkeletonInput } from "@/ui";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <>
          <SkeletonInput size={"small"} active block />
        </>
      )}
    </>
  );
};
