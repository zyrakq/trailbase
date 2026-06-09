import React from "react";

export type EmptyPlaceholderProps = {
  shape:'square' | 'circle';
  size?: number;
  condition: boolean;
  children: React.ReactNode;
};
