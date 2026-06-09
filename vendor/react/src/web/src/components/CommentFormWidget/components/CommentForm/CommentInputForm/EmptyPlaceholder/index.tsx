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
        <SkeletonInput style={{ marginTop: 8 }} active block />
      )}
    </>
  );
};
