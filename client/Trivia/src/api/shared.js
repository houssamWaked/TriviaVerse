import { http } from './httpClient';
import {
  cacheGet,
  cacheSet,
  essentialCacheClearByPrefix,
  essentialCacheGet,
  essentialCacheSet,
} from '@/utils/webCache';
import { getCurrentUser } from './userStore';

function stableParamsString(params) {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [String(k), v == null ? '' : String(v)]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

export async function cachedGet(
  url,
  { params, ttlMs = 60_000, scope = 'public', prefer = 'localStorage', cache = 'essential' } = {}
) {
  const u = String(url || '');
  const userId = scope === 'user' ? String(getCurrentUser()?.id || 'anon') : 'public';
  const key = `${scope}:${userId}:${u}?${stableParamsString(params)}`;

  const useEssential = cache === 'essential' || cache === 'auto';
  const get = useEssential ? essentialCacheGet : cacheGet;
  const set = useEssential ? essentialCacheSet : cacheSet;

  const hit = get(key);
  if (hit !== null) return hit;

  const res = await http.get(u, params ? { params } : undefined);
  set(key, res.data, { ttlMs, prefer });
  return res.data;
}

function getUserId() {
  return String(getCurrentUser()?.id || 'anon');
}

export function invalidateUserCacheByPathPrefix(pathPrefix) {
  const prefix = `user:${getUserId()}:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

export function invalidatePublicCacheByPathPrefix(pathPrefix) {
  const prefix = `public:public:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

const quizBuilderIndex = {
  questionIdToQuizId: new Map(),
  optionIdToQuizId: new Map(),
};

export function indexQuizQuestionsForQuiz(quizId, questions) {
  const qid = String(quizId || '').trim();
  if (!qid || !Array.isArray(questions)) return;

  for (const q of questions) {
    if (q?.id) quizBuilderIndex.questionIdToQuizId.set(String(q.id), qid);
    const opts = Array.isArray(q?.options) ? q.options : [];
    for (const o of opts) {
      if (o?.id) quizBuilderIndex.optionIdToQuizId.set(String(o.id), qid);
    }
  }
}

export function indexQuizQuestionId(questionId, quizId) {
  const qid = String(questionId || '').trim();
  const zid = String(quizId || '').trim();
  if (!qid || !zid) return;
  quizBuilderIndex.questionIdToQuizId.set(qid, zid);
}

export function indexQuizOptionId(optionId, quizId) {
  const oid = String(optionId || '').trim();
  const zid = String(quizId || '').trim();
  if (!oid || !zid) return;
  quizBuilderIndex.optionIdToQuizId.set(oid, zid);
}

export function getQuizIdForQuestionId(questionId) {
  const qid = String(questionId || '').trim();
  if (!qid) return null;
  return quizBuilderIndex.questionIdToQuizId.get(qid) || null;
}

export function getQuizIdForOptionId(optionId) {
  const oid = String(optionId || '').trim();
  if (!oid) return null;
  return quizBuilderIndex.optionIdToQuizId.get(oid) || null;
}
