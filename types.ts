export interface Profile {
  id: string; // uuid from auth.users
  username: string;
  lang: 'Japanese' | 'Chinese';
  avatar: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  original_text: string;
  translated_text?: string | null;
  image_url?: string | null;
  is_translating: boolean;
  created_at: string;
}

export interface Friendship {
  id: number;
  user_id1: string;
  user_id2: string;
  status: 'pending' | 'accepted';
  action_user_id: string;
}

export interface FriendRequest {
  friendship_id: number;
  requester: Profile;
}
