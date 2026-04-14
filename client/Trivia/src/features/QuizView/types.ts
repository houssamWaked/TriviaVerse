/* eslint-disable no-unused-vars */

export type CurrentUser = {
  id?: string;
  username?: string;
  email?: string;
} | null;

export type Friend = {
  id: string;
  username?: string;
};

export type QuizOwner = {
  username?: string;
};

export type QuizData = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  visibility?: string;
  owner?: QuizOwner | null;
};

export type QuizDetailsResponse = {
  quiz?: QuizData | null;
  can_edit?: boolean;
  questions_count?: number | string | null;
};

export type RatingsResponse = {
  ratings_avg?: number | string;
  ratings_count?: number | string;
  my_rating?: number | string;
};

export type LeaderboardEntry = {
  user_id: string;
  username?: string;
  rank_position?: number | string;
  best_score?: number | string;
};

export type LeaderboardResponse = {
  my_best_score?: number | string;
  entries?: LeaderboardEntry[];
  not_configured?: boolean;
};

export type QuizViewPageProps = {
  quizId: string;
  user: CurrentUser;
  onRequireAuth?: (route?: string) => void;
  onBack?: () => void;
  onEditQuiz?: (quizId: string) => void;
  onPlaySession?: (sessionId: string) => void;
  onOpenDuel?: (duelId: string) => void;
};
