import { STRINGS } from '@/constants/strings';

export function getApiErrorMessage(err) {
  const status = Number(err?.response?.status);
  const code = String(err?.response?.data?.code || '').trim();
  const message =
    err?.response?.data?.message || err?.message || STRINGS.COMMON.errors.generic;

  // Surface validation details when present so users can fix inputs immediately.
  if (code === 'VALIDATION_ERROR') {
    const list = err?.response?.data?.details?.errors || err?.response?.data?.errors;
    if (Array.isArray(list) && list.length > 0) {
      const lines = list
        .map((e) => String(e?.message || '').trim())
        .filter(Boolean)
        .slice(0, 4);
      if (lines.length > 0) return `${message}\n- ${lines.join('\n- ')}`;
    }
  }

  // Helpful hint for common auth throttling.
  if (status === 429 && code === 'RATE_LIMITED') {
    return `${message} Try again in a minute.`;
  }

  // Pool assignment conflicts (admin): show counts so it's obvious why adding failed.
  if (code === 'POOL_CONFLICT') {
    const details = err?.response?.data?.details || null;
    const lines = [];

    const pushCount = (label, arr, suffix = '') => {
      if (!Array.isArray(arr) || arr.length === 0) return;
      lines.push(`${label}: ${arr.length}${suffix}`);
    };

    if (details && typeof details === 'object') {
      pushCount('Story pool', details.story_level_conflicts);

      if (Array.isArray(details.mode_conflicts) && details.mode_conflicts.length > 0) {
        const modes = Array.from(
          new Set(
            details.mode_conflicts
              .map((c) => String(c?.mode || '').trim().toLowerCase())
              .filter(Boolean)
          )
        ).slice(0, 4);
        pushCount('Mode pool', details.mode_conflicts, modes.length ? ` (${modes.join(', ')})` : '');
      }

      pushCount('Classic category pool', details.classic_category_conflicts);
      pushCount('Classic level pool', details.classic_category_level_conflicts);
    }

    if (lines.length > 0) return `${message}\n- ${lines.join('\n- ')}`;
  }

  return message;
}

export function isUnauthorized(err) {
  return Number(err?.response?.status) === 401;
}
