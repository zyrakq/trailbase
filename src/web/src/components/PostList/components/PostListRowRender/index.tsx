import { CSSProperties, FC } from "react";

import { usePostList, usePostListRender } from "@/components/PostList/provider";

import { Post } from "@/components/Post";
import { Gap, PostWrapper } from "./styles";

import {
  CellMeasurerProps,
  MeasuredCellParent,
} from "react-virtualized/dist/es/CellMeasurer";
import { CellMeasurer as _CellMeasurer } from "react-virtualized";
const CellMeasurer = _CellMeasurer as unknown as FC<CellMeasurerProps>;

export const PostListRowRender = () => {
  const { cache, rowRender } = usePostListRender();
  const { list } = usePostList();

  const rowRenderer = ({
    key,
    index,
    style,
    parent,
  }: {
    key: string;
    index: number;
    style: CSSProperties;
    parent: MeasuredCellParent;
  }) => {
    const data = list[index];

    return (
      <CellMeasurer
        key={key}
        cache={cache.current}
        columnIndex={0}
        parent={parent}
        rowIndex={index}
      >
        {({ registerChild }) => {
          // const superiorRender = (index: number) => {
          //   return () => {
          //     rowRender(index)();
          //     //measure();
          //   };
          // }

          return (
            data && (
              <PostWrapper
                key={data.uuid}
                className="wall_without_tabs"
                ref={(el: HTMLDivElement | null) =>
                  registerChild && el && registerChild(el)
                }
                style={style}
              >
                <Post key={data.uuid} data={data} render={rowRender(index)} />
                <Gap />
              </PostWrapper>
            )
          );
        }}
      </CellMeasurer>
    );
  };
  return rowRenderer;
};
