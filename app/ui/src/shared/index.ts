// Public API for shared module

// Components
export { AppHeader } from './components/app-header';
export { FooterInfo } from './components/footer-info';
export { BundleError } from './components/bundle-error';
export { AccountMenu } from './components/account-menu';
export { SegmentedControl } from './components/segmented-control';
export { ImageCropper } from './components/image-cropper';

// Services
export { bundleLoader, BundleLoaderService } from './services/bundle-loader';

// Types
export type { BundleStatus, BundleStatusDetail } from './services/bundle-loader';
export type {
  SegmentedSelectEventDetail,
} from './components/segmented-control';
export type {
  ImageCropperCroppedEventDetail,
  ImageCropperErrorEventDetail,
} from './components/image-cropper';

// Side-effect imports register the custom elements for consumers that only
// pull the types.
import './components/segmented-control';
import './components/image-cropper';
