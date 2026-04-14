export type DuelUser = {
  id?: string;
} | null;

export type DuelQuestionOption = {
  id: string;
  label?: string | null;
  text?: string | null;
};

export type DuelAnswer = {
  user_id?: string | null;
  session_option_id?: string | null;
  is_correct?: boolean | null;
};

export type DuelQuestion = {
  question_index?: number | null;
  total_questions?: number | null;
  question_text?: string | null;
  time_limit_sec?: number | null;
  started_at?: string | null;
  correct_option_id?: string | null;
  options?: DuelQuestionOption[];
  answers?: DuelAnswer[];
  claim?: {
    winner_user_id?: string | null;
  } | null;
} | null;

export type DuelState = {
  status?: string | null;
  mode?: string | null;
  ms_until_start?: number | null;
  started_at?: string | null;
  challenger_user_id?: string | null;
  opponent_user_id?: string | null;
  challenger_points?: number | null;
  opponent_points?: number | null;
  winner_user_id?: string | null;
  quiz_id?: string | null;
  difficulty?: string | null;
  category_id?: string | null;
  question?: DuelQuestion;
};

export type DuelPlayProps = {
  user?: DuelUser;
  duelId?: string | null;
  onRequireAuth?: () => void;
  onBack?: () => void;
};
