import { PostModel } from "@/components/PostList";
import { AdditionalInfo } from "./types";
import { v4 } from "uuid";
import { format } from "date-fns";
import { DescendantDraft } from "@/pages/NewPostPage";


const get_post_items =  async (sub: string): Promise<PostModel[]> => {

    const posts = localStorage.getItem(`post-list[${sub}]`);
    let result = [];
    if (posts) {
      result = JSON.parse(posts);
    }

    return result;
  };



export const createPost = async ({ data, additional }: { data: DescendantDraft, additional: AdditionalInfo }): Promise<{ uuid: string }> => {
    return new Promise(resolve => {
        setTimeout(async() => {
          const model = {
            uuid: v4(),
            text: JSON.stringify(data.text),
            files: data.files,
            access: false,
            access_type: data.access_type,
            subscription_types: data.subscription_types,
            teaser: data.teaser,
            preview: data.preview,
            published_at: format(Date.now(), 'yyyy-MM-dd HH:mm:ss')
          } as PostModel;

          const posts = await get_post_items(additional.sub);
          posts.push(model);

          localStorage.setItem(`post-list[${additional.sub}]`, JSON.stringify(posts));

          resolve({ uuid: model.uuid });
        }, 1000);
    });
};
