import React from "react";

export type DeletedPlaceholderProps = {
  condition: boolean;
  isRecoverable: boolean;
  onRestore: () => void;
  children: React.ReactNode;
};
