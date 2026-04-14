/* eslint-disable no-unused-vars */
export type AppUser = {
  id?: string;
  username?: string;
} | null;

export type StoryLevel = {
  id?: string;
  level_id?: string;
  level_number?: number | null;
  title?: string | null;
  difficulty?: string | null;
  difficulty_max?: number | null;
  best_score?: number | null;
  stars_earned?: number | null;
  is_unlocked?: boolean | null;
  is_completed?: boolean | null;
};

export type StoryProgressResponse = {
  completed_levels?: number | null;
  total_levels?: number | null;
  levels?: StoryLevel[];
};

export type StoryPageProps = {
  user?: AppUser;
  onRequireAuth?(mode?: string): void;
  onNavigateHome?: () => void;
  onPlaySession?(sessionId?: string, levelNumber?: number): void;
};
