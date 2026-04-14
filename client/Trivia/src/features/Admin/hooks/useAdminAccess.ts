import { useMemo } from 'react';

type AdminUser = {
  email?: string;
} | null;

/**
 * Parse configured admin allowlist from Vite env.
 * @returns Lowercased set of allowed admin emails.
 */
function getAdminEmailSet() {
  const raw =
    import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '';
  return new Set(
    String(raw)
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Resolve admin access state for the current user.
 * @param user Current user snapshot.
 * @returns Admin set and access status.
 */
export function useAdminAccess(user?: AdminUser) {
  const admins = useMemo(() => getAdminEmailSet(), []);
  const email = String(user?.email || '').trim().toLowerCase();
  const isAdmin = Boolean(email) && admins.size > 0 && admins.has(email);

  return { admins, isAdmin };
}

