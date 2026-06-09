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
        <div
          style={{ display: "flex", height: "300px", justifyContent: "center" }}
        >
          <Spinner fontSize={100} style={{ alignSelf: "center" }} />
        </div>
      )}
    </>
  );
};
