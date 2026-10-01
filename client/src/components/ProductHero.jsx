import StarRating from './StarRating.jsx';
import { categoryColor, formatINR } from '../utils/theme.js';

export default function ProductHero({ product, summary }) {
  if (!product) return null;
  const color = categoryColor(product.category);

  return (
    <section className="hero">
      <div className="hero-art" style={{ background: `linear-gradient(135deg, ${color}, ${color}b3)` }}>
        {product.name.charAt(0)}
      </div>
      <div className="hero-body">
        <span className="chip" style={{ color, background: `${color}14` }}>{product.category}</span>
        <h1>{product.name}</h1>
        <div className="hero-rating">
          <StarRating value={summary.avgRating} size={20} />
          <strong>{summary.avgRating || '-'}</strong>
          <span className="muted">
            {summary.count} review{summary.count === 1 ? '' : 's'}
          </span>
        </div>
        <div className="price">{formatINR(product.price)}</div>
      </div>
    </section>
  );
}
