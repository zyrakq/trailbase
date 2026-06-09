import { AdditionalInfo, Draft } from "./types";


export const getDrafts =  async (additional: AdditionalInfo): Promise<Draft[]> => {

  const drafts = localStorage.getItem(`drafts[${additional.sub}]`);
  let result = [];
  if (drafts) {
    result = JSON.parse(drafts);
  }

  return result;
};