import { RefObject } from "react";
import { CellMeasurerCache, List } from 'react-virtualized';



export interface PostListRenderManager {
    ref: RefObject<List>,
    cache: React.MutableRefObject<CellMeasurerCache>,
    rowRender: (rowIndex: number) => () => void,
}