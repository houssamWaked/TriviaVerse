export type AppUser = {
  id?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
} | null;

export type ProfileData = {
  user?: {
    username?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
  user_stats?: {
    level?: number | null;
    xp_total?: number | null;
    streak_days?: number | null;
  } | null;
  mode_summary?: {
    by_mode?: Record<string, Record<string, unknown>>;
  } | null;
  story_progress?: {
    completed_levels?: number | null;
    total_levels?: number | null;
  } | null;
  custom_quiz_best?: Array<{
    quiz_id: string;
    title?: string | null;
    best_score?: number | null;
    updated_at?: string | null;
  }>;
};

export type PlayedQuiz = {
  quiz_id: string;
  title?: string | null;
  best_score?: number | null;
  visibility?: string | null;
  updated_at?: string | null;
};

export type DuelEntry = {
  id: string;
  status?: string | null;
  me_role?: string | null;
  challenger_user_id?: string | null;
  opponent_user_id?: string | null;
  winner_user_id?: string | null;
  opponent_user?: { username?: string | null } | null;
  challenger_user?: { username?: string | null } | null;
  quiz?: { title?: string | null } | null;
  mode?: string | null;
  difficulty?: string | null;
  challenger_points?: number | null;
  opponent_points?: number | null;
  created_at?: string | null;
  started_at?: string | null;
  current_index?: number | null;
  ms_until_start?: number | null;
};

export type ProfileProps = {
  user?: AppUser;
  friendUserId?: string | null;
  onRequireAuth?: () => void;
  onNavigateHome?: () => void;
  onOpenQuiz?: (...args: [string?]) => void;
  onOpenDuel?: (...args: [string?]) => void;
  onBack?: () => void;
};
