import { format } from "date-fns";

import { AdditionalInfo } from "./types";

import { DescendantDraft } from "../personalizer";
import { getDrafts } from "../loader/fake";
import { Draft } from "../loader";



export const saveDraft = async ({ draft, additional }: { draft: DescendantDraft, additional: AdditionalInfo }): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async() => {
          const model = {
            uuid: draft.uuid,
            text: JSON.stringify(draft.text),
            files: draft.files,
            teaser: draft.teaser,
            preview: draft.preview,
            access_type: draft.access_type,
            subscription_types: draft.subscription_types,
            created_at: draft.created_at ?? format(Date.now(), 'yyyy-MM-dd HH:mm:ss'),
            updated_at: format(Date.now(), 'yyyy-MM-dd HH:mm:ss'),
          } as Draft;
  
          let drafts = await getDrafts(additional);
          const isExists = !!drafts.find(x => x.uuid === model.uuid);
          if(isExists) {
            drafts = drafts.map(x => x.uuid === model.uuid ? model : x);
          }
          else {
            drafts.push(model);
          }
  
          localStorage.setItem(`drafts[${additional.sub}]`, JSON.stringify(drafts));
  
          resolve();
        }, 1000); 
    });
};


export const removeDraft = async ({ uuid, additional }: { uuid: string, additional: AdditionalInfo }): Promise<void> => {
  return new Promise(resolve => {
      setTimeout(async() => {


        let drafts = await getDrafts(additional);
        
        drafts = drafts.filter(x => x.uuid !== uuid);

        localStorage.setItem(`drafts[${additional.sub}]`, JSON.stringify(drafts));

        resolve();
      }, 1000); 
  });
};