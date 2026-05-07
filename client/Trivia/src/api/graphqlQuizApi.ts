import { requestGraphql } from './graphqlClient';

export const graphqlQuizApi = {
  rateQuiz: async <T = unknown>(quizId: string, rating: number) =>
    requestGraphql<T>(
      `
        mutation RateQuiz($quizId: String!, $rating: Int!) {
          rateQuiz(quizId: $quizId, rating: $rating) {
            ratings_avg
            ratings_count
            my_rating
          }
        }
      `,
      { variables: { quizId, rating }, dataPath: 'rateQuiz' },
    ),
};
