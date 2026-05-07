import { getAuthToken } from './tokenStore';

type GraphqlOptions = {
  variables?: Record<string, unknown>;
  dataPath?: string;
};

const envUrl =
  typeof import.meta.env.VITE_GRAPHQL_URL === 'string'
    ? import.meta.env.VITE_GRAPHQL_URL.trim()
    : '';

const graphqlUrl = envUrl || 'http://localhost:3000/graphql';

export async function requestGraphql<T = unknown>(
  query: string,
  options: GraphqlOptions = {}
): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      query,
      variables: options.variables,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const firstError = payload?.errors?.[0];

  if (!response.ok || firstError) {
    throw new Error(firstError?.message || payload?.message || 'GraphQL request failed');
  }

  return (options.dataPath ? payload?.data?.[options.dataPath] : payload?.data) as T;
}

export function parseGraphqlJson<T = unknown>(value: string): T {
  return JSON.parse(value) as T;
}
