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

  return message;
}

export function isUnauthorized(err) {
  return Number(err?.response?.status) === 401;
}
