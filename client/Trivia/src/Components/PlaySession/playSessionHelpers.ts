export function clampPct(n: number | string | null | undefined): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

/**
 * Clamp a value to the 0–3 star range.
 * @param n Input value.
 * @returns Integer in \([0, 3]\).
 */
export function clampStars(n: number | string | null | undefined): number {
  return Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
}

/**
 * Compute story-mode outcome (pass/stars/accuracy) from correct/total counts.
 * @param correctCount Number of correct answers.
 * @param totalCount Total number of questions answered.
 * @returns Outcome object used by the story UI.
 */
export function computeStoryOutcomeFromCounts({
  correctCount = 0,
  totalCount = 0,
}: {
  correctCount?: number | string | null;
  totalCount?: number | string | null;
} = {}) {
  const total = Math.max(0, Number(totalCount) || 0);
  const correct = Math.max(0, Number(correctCount) || 0);
  const ratio = total > 0 ? correct / total : 0;

  const passed = ratio >= 0.7;
  const stars = ratio >= 1 ? 3 : ratio >= 0.9 ? 2 : ratio >= 0.8 ? 1 : 0;
  return { passed, stars, accuracy_pct: clampPct(Math.round(ratio * 100)) };
}

/**
 * Format an integer-ish number as a Euro amount string.
 * @param n Input value.
 * @returns String like `€1,000`.
 */
export function formatMoney(n: number | string | null | undefined): string {
  const value = Math.max(0, Number(n) || 0);
  return `€${value.toLocaleString()}`;
}

