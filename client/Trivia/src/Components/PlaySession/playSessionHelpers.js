export function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export function clampStars(n) {
  return Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
}

export function computeStoryOutcomeFromCounts({ correctCount = 0, totalCount = 0 } = {}) {
  const total = Math.max(0, Number(totalCount) || 0);
  const correct = Math.max(0, Number(correctCount) || 0);
  const ratio = total > 0 ? correct / total : 0;

  const passed = ratio >= 0.7;
  const stars = ratio >= 1 ? 3 : ratio >= 0.9 ? 2 : ratio >= 0.8 ? 1 : 0;
  return { passed, stars, accuracy_pct: clampPct(Math.round(ratio * 100)) };
}

export function formatMoney(n) {
  const value = Math.max(0, Number(n) || 0);
  return `€${value.toLocaleString()}`;
}
