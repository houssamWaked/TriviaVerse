import { requestGraphql } from './graphqlClient';

export const graphqlPublicApi = {
  async health() {
    return requestGraphql<string>(
      `query Health {
        health
      }`,
      { dataPath: 'health' }
    );
  },

  async getHomeMetrics<T = unknown>() {
    return requestGraphql<T>(
      `query HomeMetrics {
        homeMetrics {
          active_players
          questions
          quizzes_created
          fun_level
        }
      }`,
      { dataPath: 'homeMetrics' }
    );
  },

  async listCategories<T = unknown>() {
    return requestGraphql<T>(
      `query PublicCategories {
        publicCategories {
          id
          name
          icon
          created_at
        }
      }`,
      { dataPath: 'publicCategories' }
    );
  },

  async getTopQuizzes<T = unknown>(limit = 20) {
    return requestGraphql<T>(
      `query TopQuizzes($limit: Int) {
        topQuizzes(limit: $limit) {
          results {
            id
            title
            description
            cover_image_url
            owner_user_id
            visibility
            status
            created_at
            published_at
            ratings_avg
            ratings_count
            played_count
            owner {
              id
              username
              avatar_url
            }
          }
        }
      }`,
      { variables: { limit }, dataPath: 'topQuizzes' }
    );
  },

  async getLeaderboard<T = unknown>(period = 'all_time', mode = 'global') {
    return requestGraphql<T>(
      `query Leaderboard($period: String, $mode: String) {
        leaderboard(period: $period, mode: $mode) {
          period
          mode
          period_resolved
          entries {
            rank_position
            user_id
            username
            avatar_url
            level
            score_value
          }
        }
      }`,
      { variables: { period, mode }, dataPath: 'leaderboard' }
    );
  },

  async searchQuizzes<T = unknown>(q: string, limit = 30) {
    return requestGraphql<T>(
      `query SearchQuizzes($q: String!, $limit: Int) {
        searchQuizzes(q: $q, limit: $limit) {
          q
          results {
            id
            title
            description
            cover_image_url
            owner_user_id
            visibility
            status
            created_at
            published_at
            ratings_avg
            ratings_count
            played_count
            owner {
              id
              username
              avatar_url
            }
          }
        }
      }`,
      { variables: { q, limit }, dataPath: 'searchQuizzes' }
    );
  },

  async getPublicQuiz<T = unknown>(quizId: string) {
    return requestGraphql<T>(
      `query PublicQuiz($quizId: String!) {
        publicQuiz(quizId: $quizId) {
          questions_count
          can_edit
          quiz {
            id
            title
            description
            cover_image_url
            owner_user_id
            visibility
            status
            created_at
            published_at
            ratings_avg
            ratings_count
            played_count
            owner {
              id
              username
              avatar_url
            }
          }
        }
      }`,
      { variables: { quizId }, dataPath: 'publicQuiz' }
    );
  },

  async getPublicQuizRatings<T = unknown>(quizId: string) {
    return requestGraphql<T>(
      `query PublicQuizRatings($quizId: String!) {
        publicQuizRatings(quizId: $quizId) {
          ratings_avg
          ratings_count
          my_rating
        }
      }`,
      { variables: { quizId }, dataPath: 'publicQuizRatings' }
    );
  },

  async getPublicQuizLeaderboard<T = unknown>(quizId: string, limit = 20) {
    return requestGraphql<T>(
      `query PublicQuizLeaderboard($quizId: String!, $limit: Int) {
        publicQuizLeaderboard(quizId: $quizId, limit: $limit) {
          quiz_id
          my_best_score
          not_configured
          entries {
            rank_position
            user_id
            username
            avatar_url
            best_score
            updated_at
          }
        }
      }`,
      { variables: { quizId, limit }, dataPath: 'publicQuizLeaderboard' }
    );
  },

  async getCategoryStats<T = unknown>(id: string) {
    return requestGraphql<T>(
      `query CategoryStats($id: String!) {
        categoryStats(id: $id) {
          category_id
          questions_available
        }
      }`,
      { variables: { id }, dataPath: 'categoryStats' }
    );
  },
};
