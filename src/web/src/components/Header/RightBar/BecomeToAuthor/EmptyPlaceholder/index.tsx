import { FC } from "react";
import { EmptyPlaceholderProps } from "./types";
import { Button, Spinner } from "@/ui";
export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  condition,
  children,
}) => {
  return (
    <>
      {condition ? (
        children
      ) : (
        <Button block style={{ width: 270 }} color="primary" variant="outlined">
          <Spinner fontSize={24} />
        </Button>
      )}
    </>
  );
};
