// import { Interweave } from "interweave";
import { Descendant } from "slate";
import { PostEditor } from "@/components/PostEditor";
import { usePost } from "@/components/Post";
import { useMemo } from "react";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { PostEditorWrapper } from "./styles";
import { ContainerCropper } from "./ContainerCropper";

export const PostContent = () => {
  const {
    data: { text, access },
  } = usePost();

  const value = useMemo(() => JSON.parse(text) as Descendant[], [text]);

  return (
    <EmptyPlaceholder condition={access}>
      <PostEditorWrapper>
        <ContainerCropper>
          <PostEditor value={value} readOnly />
        </ContainerCropper>
      </PostEditorWrapper>
    </EmptyPlaceholder>
  );
};
