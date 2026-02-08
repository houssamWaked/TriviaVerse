export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const n = String(name || '').trim();
  if (!n) return null;
  const parts = String(document.cookie || '').split(';');
  for (const raw of parts) {
    const [k, ...rest] = raw.trim().split('=');
    if (k === n) return decodeURIComponent(rest.join('=') || '');
  }
  return null;
}

export function setCookie(name, value, { maxAgeSec = 60 * 60 * 24 * 30, path = '/', sameSite = 'Lax' } = {}) {
  if (typeof document === 'undefined') return;
  const n = String(name || '').trim();
  if (!n) return;
  const v = encodeURIComponent(String(value ?? ''));
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${n}=${v}; Max-Age=${Math.max(0, Number(maxAgeSec) || 0)}; Path=${path}; SameSite=${sameSite}${secure}`;
}

export function deleteCookie(name, { path = '/' } = {}) {
  if (typeof document === 'undefined') return;
  const n = String(name || '').trim();
  if (!n) return;
  document.cookie = `${n}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}

export function deleteCookiesByPrefix(prefix, { path = '/' } = {}) {
  if (typeof document === 'undefined') return;
  const p = String(prefix || '');
  if (!p) return;

  const cookies = String(document.cookie || '').split(';');
  for (const raw of cookies) {
    const [k] = raw.trim().split('=');
    if (k && k.startsWith(p)) deleteCookie(k, { path });
  }
}
