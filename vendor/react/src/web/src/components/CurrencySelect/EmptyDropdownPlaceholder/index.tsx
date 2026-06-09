import { FC } from "react";
import { EmptyDropdownPlaceholderProps } from "./types";
import { Spinner } from "@/ui";

export const EmptyDropdownPlaceholder: FC<EmptyDropdownPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <div
          style={{ display: "flex", height: "275px", justifyContent: "center" }}
        >
          <Spinner fontSize={60} style={{ alignSelf: "center" }} />
        </div>
      )}
    </>
  );
};
