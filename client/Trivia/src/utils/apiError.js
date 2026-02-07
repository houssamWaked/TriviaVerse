import { STRINGS } from '@/constants/strings';

export function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    STRINGS.COMMON.errors.generic
  );
}

export function isUnauthorized(err) {
  return Number(err?.response?.status) === 401;
}
