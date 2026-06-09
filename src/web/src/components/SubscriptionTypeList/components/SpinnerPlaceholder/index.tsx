import { FC } from "react";
import { SpinnerPlaceholderProps } from "./types";
import { Spinner } from "@/ui";

export const SpinnerPlaceholder: FC<SpinnerPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 150,
          }}
        >
          <Spinner fontSize={70} style={{ alignSelf: "center" }} />
        </div>
      )}
    </>
  );
};
