import { STRINGS } from '@/constants/strings';

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      code?: string;
      message?: string;
      details?: {
        errors?: Array<{ message?: string }>;
        story_level_conflicts?: unknown[];
        mode_conflicts?: Array<{ mode?: string }>;
        classic_category_conflicts?: unknown[];
        classic_category_level_conflicts?: unknown[];
      };
      errors?: Array<{ message?: string }>;
    };
  };
};

/**
 * Convert an API error object into a user-facing message string.
 * @param err Axios-like error object (may include server `{ code, message, details }`).
 * @returns A readable message with helpful validation/pool-conflict details when available.
 */
export function getApiErrorMessage(err: ApiErrorLike) {
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
    const lines: string[] = [];

    const pushCount = (label: string, arr: unknown[] | undefined, suffix = '') => {
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

/**
 * Check whether an API error represents an unauthenticated request.
 * @param err Axios-like error object.
 * @returns `true` when status is 401.
 */
export function isUnauthorized(err: ApiErrorLike) {
  return Number(err?.response?.status) === 401;
}

