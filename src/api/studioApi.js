import axios from "axios";

import { api } from "./axios";
import { demoAdapter, isDemoMode } from "./demoAdapter";

// Creator (studio) endpoints — the same /api/studio/* the old studio app
// uses, with the signed-in creator's token attached.
export const TOKEN_KEY = "pipra_creator_token";
export const USER_KEY = "pipra_creator_user";

// Fired when the server rejects the token, so AuthContext can sign out
// without this module importing React state.
export const SESSION_EXPIRED_EVENT = "pipra:session-expired";

export const studioApi = axios.create({ baseURL: api.defaults.baseURL });

studioApi.interceptors.request.use((config) => {
  // Demo account: answered in the browser, never sent to the server.
  if (isDemoMode()) {
    config.adapter = demoAdapter;
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

studioApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && error?.config?.headers?.Authorization) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export const apiError = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || fallback;
