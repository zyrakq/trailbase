import styled from 'styled-components';


export const FormContent = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
`;


export const CropperWrapper = styled.div`
  .cropper-view-box {
    box-shadow: 0 0 0 3px white;
    border-radius: 16px;
    outline: 0;
  }

  .cropper-crop-box {
    border-radius: 8px;
  }

  .cropper-modal {
    background-color: #2e2e32;
    border-radius: 8px;
    opacity: 0.7;
  }

  .cropper-face {
    background-color: inherit !important;
  }
  .cropper-line {
    background-color: #b3b9c0;
    opacity: 1;
  }

  .cropper-line.line-n {
    height: 1px;
  }

  .cropper-line.line-s {
    height: 1px;
  }

  .cropper-line.line-w {
    width: 1px;
  }

  .cropper-line.line-e {
    width: 1px;
  }

  .cropper-point {
    width: 12px;
    height: 12px;
    background-color: #b3b9c0;
    opacity: 1;
  }

  .cropper-point.point-se {
    width: 12px;
    height: 12px;
    opacity: 1;
  }

  .cropper-center {
    width: 54px;
    height: 54px;
    top: 70%;
    left: 70%;
    border-radius: 50%;
    opacity: 0;
    background-color: white;
  }

  .cropper-center::after {
    display: none;
  }

  .cropper-center::before {
    display: none;
  }

  .cropper-point.point-e {
    right: -7px;
    display: none;
  }

  .cropper-point.point-s {
    bottom: -7px;
    display: none;
  }

  .cropper-point.point-w {
    display: none;
    left: -7px;
  }

  .cropper-point.point-n {
    display: none;
    top: -7px;
  }
  .cropper-point.point-ne {
    top: -7px;
    right: -7px;
  }

  .cropper-point.point-nw {
    top: -7px;
    left: -7px;
  }
  .cropper-point.point-sw {
    bottom: -7px;
    left: -7px;
  }

  .cropper-point.point-se {
    bottom: -7px;
    right: -7px;
  }

  .cropper-view-box {
    outline: inherit !important;
  }
`;
