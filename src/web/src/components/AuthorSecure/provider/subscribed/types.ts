import { SubscribedUser } from "@/services/profile";

export interface AdditionalInfo {
  sub: string;
  subscribed_user: SubscribedUser;
}

export interface AddSubscribedUser {
  subscribed_user_uuid: string;
  additional?: AdditionalInfo;
}

export interface DelSubscribedUser {
  subscribed_user_uuid: string;
  additional?: AdditionalInfo;
}

export interface SubscribedAuthorManager {
  isLoading: boolean;
  follow: () => Promise<void>;
  stopFollowing: () => Promise<void>;
}
