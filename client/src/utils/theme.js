export const APP_NAME = 'ShopSight';

const CATEGORY_COLORS = {
  Electronics: '#4f46e5',
  Home: '#0d9488',
  Fashion: '#db2777',
  Stationery: '#d97706',
  Fitness: '#2563eb',
};

export const categoryColor = (category) => CATEGORY_COLORS[category] || '#64748b';

export const formatINR = (n) => `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AVATAR_COLORS = ['#4f46e5', '#0d9488', '#db2777', '#d97706', '#2563eb', '#7c3aed'];
export const avatarColor = (name = '') => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
};
