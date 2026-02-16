const KEY = 'tv_guest_classic_progress_v1';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeCategoryKey(categoryId) {
  return String(categoryId || '').trim();
}

function clampStars(n) {
  return Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
}

export function loadGuestClassicProgress(categoryId) {
  if (typeof window === 'undefined') {
    return { completed: {}, bestScore: {}, stars: {} };
  }

  const raw = window.localStorage.getItem(KEY);
  const parsed = raw ? safeParse(raw) : null;
  const all = parsed && typeof parsed === 'object' ? parsed : {};

  const key = normalizeCategoryKey(categoryId);
  const bucket = key && all[key] && typeof all[key] === 'object' ? all[key] : {};

  const completed =
    bucket.completed && typeof bucket.completed === 'object' ? bucket.completed : {};
  const bestScore =
    bucket.bestScore && typeof bucket.bestScore === 'object' ? bucket.bestScore : {};
  const stars = bucket.stars && typeof bucket.stars === 'object' ? bucket.stars : {};

  return { completed, bestScore, stars };
}

export function saveGuestClassicResult(
  categoryId,
  levelNumber,
  { scoreTotal = 0, passed = false, stars = 0 } = {}
) {
  const key = normalizeCategoryKey(categoryId);
  const n = Number(levelNumber);
  if (!key) return false;
  if (!Number.isFinite(n) || n < 1) return false;

  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  const all = parsed && typeof parsed === 'object' ? parsed : {};

  const current = loadGuestClassicProgress(key);
  const nextBucket = {
    completed: { ...(current.completed || {}) },
    bestScore: { ...(current.bestScore || {}) },
    stars: { ...(current.stars || {}) },
  };

  if (passed) nextBucket.completed[String(n)] = true;

  const prevBest = Number(nextBucket.bestScore[String(n)] || 0) || 0;
  nextBucket.bestScore[String(n)] = Math.max(prevBest, Number(scoreTotal) || 0);

  const nextStars = clampStars(stars);
  const prevStars = Number(nextBucket.stars[String(n)] || 0) || 0;
  nextBucket.stars[String(n)] = Math.max(prevStars, nextStars);

  const merged = { ...all, [key]: nextBucket };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  return true;
}

export function computeGuestClassicUnlockedMax(categoryId, levels = []) {
  const key = normalizeCategoryKey(categoryId);
  const progress = loadGuestClassicProgress(key);
  const completedNums = Object.keys(progress.completed || {})
    .filter((k) => progress.completed[k])
    .map((k) => Number(k))
    .filter((x) => Number.isFinite(x) && x > 0);

  const maxCompleted = completedNums.length ? Math.max(...completedNums) : 0;
  const unlockedMax = Math.max(1, maxCompleted + 1);
  const maxLevel = (Array.isArray(levels) ? levels : [])
    .map((l) => Number(l?.level_number))
    .filter((x) => Number.isFinite(x) && x > 0)
    .reduce((acc, x) => Math.max(acc, x), 1);

  return Math.min(unlockedMax, maxLevel || unlockedMax);
}

