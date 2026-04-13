import { http } from './httpClient';
import { endpoints } from './endpoints';

/**
 * Auth API wrapper for calling `/api/auth/*` endpoints.
 */
export const authApi = {
  /**
   * Register a new account.
   * @param body Registration payload.
   * @returns Promise resolving to the register response payload.
   */
  register: async (body: unknown) => (await http.post(endpoints.register(), body)).data,
  /**
   * Log in with email/password.
   * @param body Login payload.
   * @returns Promise resolving to `{ user, token }`.
   */
  login: async (body: unknown) => (await http.post(endpoints.login(), body)).data,
  /**
   * Log in with Google (ID token exchange).
   * @param body Google auth payload.
   * @returns Promise resolving to `{ user, token }`.
   */
  googleAuth: async (body: unknown) => (await http.post(endpoints.googleAuth(), body)).data,
  /**
   * Log out (clears server refresh cookie).
   * @returns Promise resolving to a success payload.
   */
  logout: async () => (await http.post(endpoints.logout(), {})).data,
  /**
   * Verify an email verification token.
   * @param body Verification payload.
   * @returns Promise resolving to verification result.
   */
  verifyEmail: async (body: unknown) => (await http.post(endpoints.verifyEmail(), body)).data,
  /**
   * Request a new verification email.
   * @param body Resend payload.
   * @returns Promise resolving to resend result.
   */
  resendVerification: async (body: unknown) =>
    (await http.post(endpoints.resendVerification(), body)).data,
  /**
   * Refresh the session (access token) using the httpOnly refresh cookie.
   * @returns Promise resolving to refresh result (may include a new token).
   */
  refreshSession: async () => (await http.post(endpoints.refresh(), {})).data,
};
