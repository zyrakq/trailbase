import { FC, RefObject, createRef, useEffect } from "react";
import { HiderWrapper, GradientWrapper } from "./styles";
import { ContainerHiderProps } from "./types";

export const ContainerHider: FC<ContainerHiderProps> = ({ height, onChangeHeight, isExpanded, children }) => {

  const ref:RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    if(ref.current){
      onChangeHeight(ref.current.offsetHeight);
    }
  }, [ref, onChangeHeight]);

  return (
    <div style={{ position: 'relative' }}>
      <HiderWrapper style={{ height: (isExpanded ? 'auto' : height) }}>
        <div ref={ref}>
          {children}
        </div>
      </HiderWrapper>
      {!isExpanded && <GradientWrapper />}
    </div>
    
  );
};
