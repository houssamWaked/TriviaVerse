/* eslint-disable no-unused-vars */
export type AppUser = {
  id?: string;
  username?: string;
} | null;

export type BlitzDifficulty = 'easy' | 'medium' | 'hard';

export type BlitzConfig = {
  time_limit_sec?: number | null;
};

export type DuelFriend = {
  id: string;
  username?: string | null;
};

export type BlitzProps = {
  user?: AppUser;
  onRequireAuth?: (mode?: string) => void;
  onNavigateHome?: () => void;
  onPlaySession?: (sessionId?: string) => void;
  onOpenDuel?: (duelId?: string) => void;
};
