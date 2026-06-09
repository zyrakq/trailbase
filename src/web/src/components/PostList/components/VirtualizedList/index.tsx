import { CSSProperties, FC } from "react";

import {
  AutoSizer as _AutoSizer,
  AutoSizerProps,
  CellMeasurerCache,
  List as _List,
  ListProps,
  WindowScroller as _WindowScroller,
  WindowScrollerProps,
} from "react-virtualized";
import { MeasuredCellParent } from "react-virtualized/dist/es/CellMeasurer";

const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps>;
const WindowScroller = _WindowScroller as unknown as FC<WindowScrollerProps>;
const List = _List as unknown as FC<ListProps>;

export interface VirtualizedListProps<T = unknown> {
  dataRef?: React.RefObject<_List> | undefined;
  cache?: React.MutableRefObject<CellMeasurerCache> | undefined;
  data: T[];
  overscanRowCount: number;
  rowHeight: number | ((params: { index: number }) => number);
  rowRenderer: ({
    key,
    index,
    style,
    parent,
  }: {
    key: string;
    index: number;
    style: CSSProperties;
    parent: MeasuredCellParent;
  }) => JSX.Element;
}

export const VirtualizedList: FC<VirtualizedListProps> = ({
  data,
  overscanRowCount,
  rowHeight,
  rowRenderer,
  dataRef = undefined,
  cache = undefined,
}) => {
  return (
    <WindowScroller>
      {({ height, scrollTop, isScrolling /* onChildScroll */ }) => (
        <AutoSizer disableHeight>
          {({ width }): JSX.Element => (
            <List
              autoHeight
              data={data}
              deferredMeasurementCache={cache?.current}
              height={height}
              overscanRowCount={overscanRowCount}
              ref={dataRef}
              rowCount={Object.keys(data).length}
              rowHeight={rowHeight}
              rowRenderer={rowRenderer}
              rowStyle={{ height }}
              scrollTop={scrollTop}
              isScrolling={isScrolling}
              onScroll={() => {}}
              //onChildScroll={onChildScroll}
              width={width}
            />
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );
};
