// import { chain } from 'lodash';

import { previewFallbackLight } from "./preview/preview-light";
import { previewFallbackDark } from "./preview/preview.dark";

// import { PhotoModel, PhotoPreviewModel, PostedFileModel } from '@/services/api';

export const ALLOW_FORMATS = ['image/jpg', 'image/jpeg', 'image/png'];

export const isAllowFormat = (file: File) => ALLOW_FORMATS.includes(file.type);

// export const getPhotoPreview = (
//   photo?: PhotoModel | PhotoPreviewModel,
//   quality = 144,
// ) => {
//   const prev = chain(photo?.previews)
//     .sortBy('quality')
//     .find((x) => {
//       if (x?.quality) {
//         return x.quality >= quality;
//       }

//       return false;
//     })
//     .value();

//   return (prev?.fileUrl || photo?.fileUrl) ?? imageFallback;
// };

export const getPreview = (photo?: string) => {
  let url = photo
  && (photo.indexOf('data:image') === -1
  && photo.indexOf('http') === -1)
  ? `${import.meta.env.REACT_APP_AVATAR_DOWNLOADER_URL}/${photo}`: photo;
  return url;
};


export const getPreviewWithFallback = ( mode: string, photo?: string) => {
  return getPreview(photo) || (mode === 'light' ? previewFallbackLight: previewFallbackDark);
};
