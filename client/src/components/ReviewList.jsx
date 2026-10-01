import StarRating from './StarRating.jsx';
import { avatarColor, formatDate } from '../utils/theme.js';

export default function ReviewList({ reviews }) {
  if (!reviews.length) {
    return <p className="empty">No reviews yet. Be the first to share your thoughts.</p>;
  }

  return (
    <ul className="review-list">
      {reviews.map((r) => {
        const name = r.user?.name || 'Customer';
        return (
          <li className="review" key={r._id}>
            <span className="avatar" style={{ background: avatarColor(name) }}>
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="review-main">
              <div className="review-head">
                <strong>{name}</strong>
                <span className="muted">{formatDate(r.createdAt)}</span>
              </div>
              <StarRating value={r.rating} size={15} />
              {r.comment && <p className="review-text">{r.comment}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
