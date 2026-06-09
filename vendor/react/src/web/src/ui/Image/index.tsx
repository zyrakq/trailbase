import AntImage, { ImageProps } from 'antd/lib/image';

export type { ImageProps } from 'antd/lib/image';

export const Image = (props: ImageProps) => <AntImage {...props} />;

export const { PreviewGroup } = AntImage;
