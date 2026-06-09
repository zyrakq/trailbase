
import { AccessSetupWidget } from './AccessSetupWidget';
import { FC } from 'react';
import { DraftMenu } from './DraftMenu';

export const RightCard: FC = () => {

  return (
      <>
        <DraftMenu />
        <AccessSetupWidget />
      </>
  );
};
