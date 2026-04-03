type SameSite = 'Lax' | 'Strict' | 'None';

type CookieOptions = {
  maxAgeSec?: number;
  path?: string;
  sameSite?: SameSite;
};

type DeleteCookieOptions = {
  path?: string;
};

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

export function deleteCookie(name: string, options: DeleteCookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const normalizedName = String(name).trim();
  if (!normalizedName) return;
  const { path = '/' } = options;
  document.cookie = `${normalizedName}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}

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
