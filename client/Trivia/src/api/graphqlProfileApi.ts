import { requestGraphql } from './graphqlClient';

type GraphqlProfileResponse = {
  user?: unknown;
  user_stats?: unknown;
  mode_summary?: {
    entries?: Array<{
      mode: string;
      played: number;
      completed: number;
      best_score: number;
      last_played_at?: string | null;
    }>;
  };
  story_progress?: unknown;
  custom_quiz_best?: unknown[];
};

function normalizeProfile(payload: GraphqlProfileResponse) {
  const entries = payload?.mode_summary?.entries || [];
  const by_mode = Object.fromEntries(entries.map((entry) => [entry.mode, entry]));
  return {
    ...payload,
    mode_summary: { by_mode },
  };
}

export const graphqlProfileApi = {
  getMyProfile: async <T = unknown>() => {
    const payload = await requestGraphql<GraphqlProfileResponse>(
      `
        query MyProfile {
          myProfile {
            user {
              id
              username
              email
              avatar_url
            }
            user_stats {
              level
              xp_total
              streak_days
            }
            mode_summary {
              entries {
                mode
                played
                completed
                best_score
                last_played_at
              }
            }
            story_progress {
              completed_levels
              total_levels
            }
            custom_quiz_best {
              quiz_id
              title
              best_score
              updated_at
            }
          }
        }
      `,
      { dataPath: 'myProfile' },
    );
    return normalizeProfile(payload) as T;
  },
};
