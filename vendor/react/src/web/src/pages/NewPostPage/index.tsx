import { FC } from 'react';

import { Col, Row } from 'antd';
import { CenterCard } from './components/CenterCard';
import { RightCard } from './components/RightCard';

export {
  PostAccessType,
  useDraftList,
  useDraftPersonalizer,
  usePostSender,
  useDraftChanger,
  useDraftChooser
} from './hook';

export type {
  DraftListManager,
  Draft,
  DraftPersonalizerManager,
  DescendantDraft,
  PostSenderManager,
  DraftChangerManager,
  DraftChooserManager
} from './hook';

export const NewPostPage: FC = () => {

  return (
    <Row
      gutter={[16, 16]}
      style={{ width: '100%', padding: '24px 16px' }}
      wrap={false}
    >
      <Col flex="181px" />
      <Col flex="646px">
        <CenterCard />
      </Col>
      <Col flex="323px">
        <RightCard />
      </Col>
      <Col flex="142px" />
    </Row>
  );
};
