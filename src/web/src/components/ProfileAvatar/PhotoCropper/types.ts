import { RefObject } from "react";
import { ReactCropperElement } from "react-cropper";

export type PhotoCropperProps = {
  cropperRef: RefObject<ReactCropperElement>; 

  open: boolean;
  close: () => void;

  attachment: string | undefined;
  attach: (file: File) => void;

  submit: () => Promise<void>;
};

export interface PhotoCropperManager {
    cropperRef: RefObject<ReactCropperElement>; 

    opened: boolean;
    open: () => void;
    close: () => void;

    attachment: string | undefined;
    attach: (file: File) => void;

    submit: () => Promise<void>;
}