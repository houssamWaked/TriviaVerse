/* eslint-disable no-unused-vars */
export type AppUser = {
  id?: string;
  username?: string;
} | null;

export type DiscoverQuiz = {
  id: string;
  title?: string | null;
  visibility?: string | null;
  ratings_avg?: number | null;
  ratings_count?: number | null;
  description?: string | null;
  published_at?: string | null;
  owner?: {
    username?: string | null;
  } | null;
};

export type OpenQuizHandler = {
  (quizId?: string): void;
};

export type DiscoverQuizzesPageProps = {
  user?: AppUser;
  onOpenQuiz?: OpenQuizHandler;
  onNavigateHome?: () => void;
};
