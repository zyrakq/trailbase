import React from "react";

export type TextAreaEditorProps = {
  condition: boolean;
  text: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
};
