const KEY = 'tv_guest_story_progress_v1';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadGuestStoryProgress() {
  if (typeof window === 'undefined') return { completed: {}, bestScore: {} };
  const raw = window.localStorage.getItem(KEY);
  const parsed = raw ? safeParse(raw) : null;
  const completed = parsed?.completed && typeof parsed.completed === 'object' ? parsed.completed : {};
  const bestScore = parsed?.bestScore && typeof parsed.bestScore === 'object' ? parsed.bestScore : {};
  return { completed, bestScore };
}

export function saveGuestStoryResult(levelNumber, { scoreTotal = 0, passed = false } = {}) {
  const n = Number(levelNumber);
  if (!Number.isFinite(n) || n < 1) return false;

  const current = loadGuestStoryProgress();
  const next = {
    completed: { ...(current.completed || {}) },
    bestScore: { ...(current.bestScore || {}) },
  };

  if (passed) next.completed[String(n)] = true;
  const prevBest = Number(next.bestScore[String(n)] || 0) || 0;
  next.bestScore[String(n)] = Math.max(prevBest, Number(scoreTotal) || 0);

  window.localStorage.setItem(KEY, JSON.stringify(next));
  return true;
}

export function computeGuestStoryUnlockedMax(levels = []) {
  const progress = loadGuestStoryProgress();
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

