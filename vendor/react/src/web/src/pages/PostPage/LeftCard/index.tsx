import { FC } from "react";
import { MiniCardWidget } from "@/widgets/Author/MiniCardWidget";
import { NewPostWidget } from "@/widgets/Author/NewPostWidget";

export const LeftCard: FC = () => {
  return (
    <>
      <MiniCardWidget />
      <NewPostWidget />
    </>
  );
};
