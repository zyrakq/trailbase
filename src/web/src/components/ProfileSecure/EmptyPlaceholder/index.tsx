import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { Spinner } from "@/ui";

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <Spinner fontSize={100} style={{ alignSelf: "center" }} />
      )}
    </>
  );
};
