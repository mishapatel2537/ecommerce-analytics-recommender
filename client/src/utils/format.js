// Shared formatters so every page shows money and dates the same way.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const formatPrice = (n) => usd.format(Number(n) || 0);
export const formatPriceRounded = (n) => usd0.format(Number(n) || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

// "3 days ago", "2 months ago"; falls back to a date after a year
export function timeAgo(d) {
  const seconds = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) {
      if (unit === 'year') return formatDate(d);
      return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}
