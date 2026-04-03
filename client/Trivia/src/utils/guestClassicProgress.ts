const KEY = 'tv_guest_classic_progress_v1';

type LevelProgressMap = Record<string, number | boolean>;

type GuestClassicBucket = {
  completed: Record<string, boolean>;
  bestScore: Record<string, number>;
  stars: Record<string, number>;
};

type GuestClassicStore = Record<string, Partial<GuestClassicBucket>>;

type GuestClassicResultInput = {
  scoreTotal?: number;
  passed?: boolean;
  stars?: number;
};

type LevelLike = {
  level_number?: number | string | null;
};

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeCategoryKey(categoryId: unknown): string {
  return String(categoryId || '').trim();
}

function clampStars(value: unknown): number {
  return Math.max(0, Math.min(3, Math.floor(Number(value) || 0)));
}

function normalizeBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as LevelProgressMap).map(([key, entryValue]) => [key, Boolean(entryValue)])
  );
}

function normalizeNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as LevelProgressMap).map(([key, entryValue]) => [key, Number(entryValue) || 0])
  );
}

export function loadGuestClassicProgress(categoryId: unknown): GuestClassicBucket {
  if (typeof window === 'undefined') {
    return { completed: {}, bestScore: {}, stars: {} };
  }

  const raw = window.localStorage.getItem(KEY);
  const parsed = raw ? safeParse(raw) : null;
  const all = parsed && typeof parsed === 'object' ? (parsed as GuestClassicStore) : {};

  const key = normalizeCategoryKey(categoryId);
  const bucket = key && all[key] && typeof all[key] === 'object' ? all[key] : {};

  return {
    completed: normalizeBooleanMap(bucket.completed),
    bestScore: normalizeNumberMap(bucket.bestScore),
    stars: normalizeNumberMap(bucket.stars),
  };
}

export function saveGuestClassicResult(
  categoryId: unknown,
  levelNumber: unknown,
  { scoreTotal = 0, passed = false, stars = 0 }: GuestClassicResultInput = {}
): boolean {
  const key = normalizeCategoryKey(categoryId);
  const normalizedLevel = Number(levelNumber);
  if (!key) return false;
  if (!Number.isFinite(normalizedLevel) || normalizedLevel < 1) return false;

  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  const all = parsed && typeof parsed === 'object' ? (parsed as GuestClassicStore) : {};

  const current = loadGuestClassicProgress(key);
  const nextBucket: GuestClassicBucket = {
    completed: { ...current.completed },
    bestScore: { ...current.bestScore },
    stars: { ...current.stars },
  };

  const progressKey = String(normalizedLevel);
  if (passed) nextBucket.completed[progressKey] = true;

  const prevBest = Number(nextBucket.bestScore[progressKey] || 0) || 0;
  nextBucket.bestScore[progressKey] = Math.max(prevBest, Number(scoreTotal) || 0);

  const nextStars = clampStars(stars);
  const prevStars = Number(nextBucket.stars[progressKey] || 0) || 0;
  nextBucket.stars[progressKey] = Math.max(prevStars, nextStars);

  const merged = { ...all, [key]: nextBucket };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  return true;
}

export function computeGuestClassicUnlockedMax(categoryId: unknown, levels: LevelLike[] = []): number {
  const key = normalizeCategoryKey(categoryId);
  const progress = loadGuestClassicProgress(key);
  const completedNums = Object.keys(progress.completed)
    .filter((progressKey) => progress.completed[progressKey])
    .map((progressKey) => Number(progressKey))
    .filter((value) => Number.isFinite(value) && value > 0);

  const maxCompleted = completedNums.length ? Math.max(...completedNums) : 0;
  const unlockedMax = Math.max(1, maxCompleted + 1);
  const maxLevel = levels
    .map((level) => Number(level?.level_number))
    .filter((value) => Number.isFinite(value) && value > 0)
    .reduce((accumulator, value) => Math.max(accumulator, value), 1);

  return Math.min(unlockedMax, maxLevel || unlockedMax);
}
