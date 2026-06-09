import React, { ChangeEventHandler, useRef, useState } from "react";

import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

import { AddPhotoAlternate as AddImageIcon } from "@styled-icons/material-outlined/AddPhotoAlternate";

import { ALLOW_FORMATS, isAllowFormat } from "@/utils/photo";
import { CoverHover } from "@/ui";

import { StyledBox, StyledBoxWrapper } from "./styles";

export interface DragItem {
  files: File[];
}

export interface ImageUploadBoxProps {
  src?: string;
  onAttach?: (file: File) => void;
  text?: string;
}

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  onAttach,
  src,
  text,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | undefined>(
    undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      drop(item) {
        const file = (item as DragItem).files[0];
        if (!isAllowFormat(file)) return;

        if (onAttach) onAttach(file);
        setSelectedImage(file);
      },
    }),
    [onAttach]
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    if (!target.files) return;

    const files = Array.from(target.files);
    const [file] = files;

    if (!isAllowFormat(file)) return;

    if (inputRef.current) inputRef.current.value = "";
    if (onAttach) onAttach(file);
    setSelectedImage(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <StyledBoxWrapper ref={drop} onClick={handleClick}>
      {selectedImage || src ? (
        <CoverHover
          content={
            <>
              <AddImageIcon size={28} />
              {text && <p>{text}</p>}
            </>
          }
        >
          <img
            alt="preview"
            src={selectedImage ? URL.createObjectURL(selectedImage) : src}
          />
        </CoverHover>
      ) : (
        <StyledBox>
          <AddImageIcon size={28} />
          {text && <p>{text}</p>}
        </StyledBox>
      )}
      <input
        style={{ display: "none" }}
        accept={ALLOW_FORMATS.join(",")}
        ref={inputRef}
        type="file"
        onChange={handleChange}
      />
    </StyledBoxWrapper>
  );
};
