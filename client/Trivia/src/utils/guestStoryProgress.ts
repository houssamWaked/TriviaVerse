const KEY = 'tv_guest_story_progress_v1';

type GuestStoryBucket = {
  completed: Record<string, boolean>;
  bestScore: Record<string, number>;
  stars: Record<string, number>;
};

type GuestStoryResultInput = {
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

function normalizeBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, Boolean(entryValue)])
  );
}

function normalizeNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, Number(entryValue) || 0])
  );
}

/**
 * Load guest story progress from localStorage.
 * @returns Progress bucket containing completion, best scores, and stars.
 */
export function loadGuestStoryProgress(): GuestStoryBucket {
  if (typeof window === 'undefined') return { completed: {}, bestScore: {}, stars: {} };
  const raw = window.localStorage.getItem(KEY);
  const parsed = raw ? safeParse(raw) : null;
  const store = parsed && typeof parsed === 'object' ? parsed : {};
  return {
    completed: normalizeBooleanMap((store as Partial<GuestStoryBucket>).completed),
    bestScore: normalizeNumberMap((store as Partial<GuestStoryBucket>).bestScore),
    stars: normalizeNumberMap((store as Partial<GuestStoryBucket>).stars),
  };
}

/**
 * Save a guest story session result for a level (updates best score/stars and completion).
 * @param levelNumber Story level number.
 * @param scoreTotal Session score total.
 * @param passed Whether the level was passed.
 * @param stars Stars earned for this attempt.
 * @returns `true` on success, `false` for invalid input.
 */
export function saveGuestStoryResult(
  levelNumber: unknown,
  { scoreTotal = 0, passed = false, stars = 0 }: GuestStoryResultInput = {}
): boolean {
  const normalizedLevel = Number(levelNumber);
  if (!Number.isFinite(normalizedLevel) || normalizedLevel < 1) return false;

  const current = loadGuestStoryProgress();
  const next: GuestStoryBucket = {
    completed: { ...current.completed },
    bestScore: { ...current.bestScore },
    stars: { ...current.stars },
  };

  const progressKey = String(normalizedLevel);
  if (passed) next.completed[progressKey] = true;
  const prevBest = Number(next.bestScore[progressKey] || 0) || 0;
  next.bestScore[progressKey] = Math.max(prevBest, Number(scoreTotal) || 0);

  const nextStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  const prevStars = Number(next.stars[progressKey] || 0) || 0;
  next.stars[progressKey] = Math.max(prevStars, nextStars);

  window.localStorage.setItem(KEY, JSON.stringify(next));
  return true;
}

/**
 * Compute the maximum unlocked story level for a guest based on completed levels.
 * @param levels Full level list (used to cap unlock value).
 * @returns Highest unlocked level number (>= 1).
 */
export function computeGuestStoryUnlockedMax(levels: LevelLike[] = []): number {
  const progress = loadGuestStoryProgress();
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
