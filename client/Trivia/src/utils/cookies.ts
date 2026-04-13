type SameSite = 'Lax' | 'Strict' | 'None';

type CookieOptions = {
  maxAgeSec?: number;
  path?: string;
  sameSite?: SameSite;
};

type DeleteCookieOptions = {
  path?: string;
};

/**
 * Read a cookie value by name.
 * @param name Cookie name.
 * @returns Cookie value (decoded) or `null` if missing/unavailable.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const normalizedName = String(name).trim();
  if (!normalizedName) return null;
  const parts = String(document.cookie || '').split(';');
  for (const raw of parts) {
    const [key, ...rest] = raw.trim().split('=');
    if (key === normalizedName) return decodeURIComponent(rest.join('=') || '');
  }
  return null;
}

/**
 * Set a cookie with basic options (max-age/path/samesite).
 * @param name Cookie name.
 * @param value Cookie value (stringified).
 * @param options Cookie options.
 * @returns Void.
 */
export function setCookie(name: string, value: unknown, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const normalizedName = String(name).trim();
  if (!normalizedName) return;
  const { maxAgeSec = 60 * 60 * 24 * 30, path = '/', sameSite = 'Lax' } = options;
  const encodedValue = encodeURIComponent(String(value ?? ''));
  const secure =
    typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${normalizedName}=${encodedValue}; Max-Age=${Math.max(
    0,
    Number(maxAgeSec) || 0
  )}; Path=${path}; SameSite=${sameSite}${secure}`;
}

/**
 * Delete a cookie by setting a zero Max-Age.
 * @param name Cookie name.
 * @param options Delete options (path must match how it was set).
 * @returns Void.
 */
export function deleteCookie(name: string, options: DeleteCookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const normalizedName = String(name).trim();
  if (!normalizedName) return;
  const { path = '/' } = options;
  document.cookie = `${normalizedName}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}

/**
 * Delete all cookies whose names start with a prefix.
 * @param prefix Cookie name prefix.
 * @param options Delete options (path must match how cookies were set).
 * @returns Void.
 */
export function deleteCookiesByPrefix(prefix: string, options: DeleteCookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const normalizedPrefix = String(prefix);
  if (!normalizedPrefix) return;
  const { path = '/' } = options;
  const cookies = String(document.cookie || '').split(';');
  for (const raw of cookies) {
    const [key] = raw.trim().split('=');
    if (key && key.startsWith(normalizedPrefix)) {
      deleteCookie(key, { path });
    }
  }
}
