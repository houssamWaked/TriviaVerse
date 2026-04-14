/* eslint-disable no-unused-vars */

export type AppUser = {
  id?: string;
  username?: string;
} | null;

export type FriendRow = {
  id: string;
  username?: string | null;
};

export type FriendRequest = {
  request_id: string;
  created_at?: string | null;
  user?: {
    username?: string | null;
  } | null;
};

export type FriendsProps = {
  user?: AppUser;
  onRequireAuth?: (...args: [string?]) => void;
  onNavigateHome?: () => void;
  onOpenFriend?: (...args: [string?]) => void;
};
