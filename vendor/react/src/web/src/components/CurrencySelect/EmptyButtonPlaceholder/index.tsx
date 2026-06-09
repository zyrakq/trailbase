import { FC } from "react";
import { EmptyButtonPlaceholderProps } from "./types";
import { Button, Spinner } from "@/ui";

export const EmptyButtonPlaceholder: FC<EmptyButtonPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <Button color="primary" variant="outlined" style={{ width: 246 }} block>
          <Spinner fontSize={24} />
        </Button>
      )}
    </>
  );
};
