import { requestGraphql } from './graphqlClient';

export const graphqlAuthApi = {
  login: async <T = unknown>(email: string, password: string) =>
    requestGraphql<T>(
      `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              username
              email
              avatar_url
            }
          }
        }
      `,
      { variables: { email, password }, dataPath: 'login' },
    ),

  me: async <T = unknown>() =>
    requestGraphql<T>(
      `
        query Me {
          me {
            id
            username
            email
            avatar_url
          }
        }
      `,
      { dataPath: 'me' },
    ),
};
