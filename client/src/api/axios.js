import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Development auth stub. Once real login exists, replace this
// with:  cfg.headers.Authorization = `Bearer ${token}`
api.interceptors.request.use((cfg) => {
  const uid = localStorage.getItem('testUserId');
  const role = localStorage.getItem('testRole');
  if (uid) cfg.headers['x-test-user-id'] = uid;
  if (role) cfg.headers['x-test-role'] = role;
  return cfg;
});

export default api;
