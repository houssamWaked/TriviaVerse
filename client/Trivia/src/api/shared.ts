import { http } from './httpClient';
import {
  cacheGet,
  cacheSet,
  essentialCacheClearByPrefix,
  essentialCacheGet,
  essentialCacheSet,
} from '@/utils/webCache';
import { getCurrentUser } from './userStore';

type PrimitiveParam = string | number | boolean | null | undefined;
type QueryParams = Record<string, PrimitiveParam>;
type CacheScope = 'public' | 'user';
type CachePreference = 'localStorage' | 'cookie' | 'both';
type CacheMode = 'essential' | 'standard' | 'auto';

type CachedGetOptions = {
  params?: QueryParams;
  ttlMs?: number;
  scope?: CacheScope;
  prefer?: CachePreference;
  cache?: CacheMode;
};

type IndexedQuestion = {
  id?: string | number | null;
  options?: Array<{ id?: string | number | null } | null> | null;
} | null;

function stableParamsString(params?: QueryParams) {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [String(key), value == null ? '' : String(value)] as const);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

export async function cachedGet<T = unknown>(
  url: string,
  {
    params,
    ttlMs = 60_000,
    scope = 'public',
    prefer = 'localStorage',
    cache = 'essential',
  }: CachedGetOptions = {}
): Promise<T> {
  const normalizedUrl = String(url || '');
  const userId = scope === 'user' ? String(getCurrentUser()?.id || 'anon') : 'public';
  const key = `${scope}:${userId}:${normalizedUrl}?${stableParamsString(params)}`;

  const useEssential = cache === 'essential' || cache === 'auto';
  const get = useEssential ? essentialCacheGet : cacheGet;
  const hit = get(key) as T | null;
  if (hit !== null) return hit;

  const response = await http.get<T>(normalizedUrl, params ? { params } : undefined);
  if (useEssential) {
    essentialCacheSet(key, response.data, { ttlMs });
  } else {
    cacheSet(key, response.data, { ttlMs, prefer });
  }
  return response.data;
}

function getUserId() {
  return String(getCurrentUser()?.id || 'anon');
}

export function invalidateUserCacheByPathPrefix(pathPrefix: string) {
  const prefix = `user:${getUserId()}:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

export function invalidatePublicCacheByPathPrefix(pathPrefix: string) {
  const prefix = `public:public:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

const quizBuilderIndex = {
  questionIdToQuizId: new Map<string, string>(),
  optionIdToQuizId: new Map<string, string>(),
};

export function indexQuizQuestionsForQuiz(
  quizId: string | number | null | undefined,
  questions: IndexedQuestion[] | null | undefined
) {
  const normalizedQuizId = String(quizId || '').trim();
  if (!normalizedQuizId || !Array.isArray(questions)) return;

  for (const question of questions) {
    if (question?.id) quizBuilderIndex.questionIdToQuizId.set(String(question.id), normalizedQuizId);
    const options = Array.isArray(question?.options) ? question.options : [];
    for (const option of options) {
      if (option?.id) quizBuilderIndex.optionIdToQuizId.set(String(option.id), normalizedQuizId);
    }
  }
}

export function indexQuizQuestionId(
  questionId: string | number | null | undefined,
  quizId: string | number | null | undefined
) {
  const normalizedQuestionId = String(questionId || '').trim();
  const normalizedQuizId = String(quizId || '').trim();
  if (!normalizedQuestionId || !normalizedQuizId) return;
  quizBuilderIndex.questionIdToQuizId.set(normalizedQuestionId, normalizedQuizId);
}

export function indexQuizOptionId(
  optionId: string | number | null | undefined,
  quizId: string | number | null | undefined
) {
  const normalizedOptionId = String(optionId || '').trim();
  const normalizedQuizId = String(quizId || '').trim();
  if (!normalizedOptionId || !normalizedQuizId) return;
  quizBuilderIndex.optionIdToQuizId.set(normalizedOptionId, normalizedQuizId);
}

export function getQuizIdForQuestionId(questionId: string | number | null | undefined) {
  const normalizedQuestionId = String(questionId || '').trim();
  if (!normalizedQuestionId) return null;
  return quizBuilderIndex.questionIdToQuizId.get(normalizedQuestionId) || null;
}

export function getQuizIdForOptionId(optionId: string | number | null | undefined) {
  const normalizedOptionId = String(optionId || '').trim();
  if (!normalizedOptionId) return null;
  return quizBuilderIndex.optionIdToQuizId.get(normalizedOptionId) || null;
}
