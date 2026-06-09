export type ContainerHiderProps = {
  height: number;
  onChangeHeight: (offsetHeight: number) => void;
  isExpanded: boolean;
  children: React.ReactNode;
};
