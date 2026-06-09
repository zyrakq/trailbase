
import { BackLink } from './BackLink';
import { Editor } from './Editor';
import { SectionTag } from './SectionTag';
import { SectionTeaser } from './SectionTeaser';
import { SubmitButton } from './SubmitButton';

export const CenterCard = () => {

  return (
    <>
      <BackLink />
      <Editor />
      <SectionTeaser />
      <SectionTag />
      <SubmitButton />
    </>
  );
};
