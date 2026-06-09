import { FC } from "react";
import { CardWidget } from "@/widgets/Author/CardWidget";
import { NewPostWidget } from "@/widgets/Author/NewPostWidget";

export const LeftCard: FC = () => {
  return (
    <>
      <CardWidget />
      <NewPostWidget />
    </>
  );
};
