import { http } from './httpClient';
import { endpoints } from './endpoints';

export const authApi = {
  register: async (body) => (await http.post(endpoints.register(), body)).data,
  login: async (body) => (await http.post(endpoints.login(), body)).data,
  googleAuth: async (body) => (await http.post(endpoints.googleAuth(), body)).data,
  logout: async () => (await http.post(endpoints.logout(), {})).data,
  verifyEmail: async (body) => (await http.post(endpoints.verifyEmail(), body)).data,
  resendVerification: async (body) => (await http.post(endpoints.resendVerification(), body)).data,
  refreshSession: async () => (await http.post(endpoints.refresh(), {})).data,
};
