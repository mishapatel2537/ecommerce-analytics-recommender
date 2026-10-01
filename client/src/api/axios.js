import axios from 'axios';

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a request that carried a token means the session is no longer valid.
// AuthContext listens for this event and logs the user out.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

// Pull a readable message out of an API error
export function errorMessage(err, fallback = 'Something went wrong') {
  return err.response?.data?.message || (err.request && !err.response ? 'Cannot reach the server' : fallback);
}

export default api;
