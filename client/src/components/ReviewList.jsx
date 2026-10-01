import StarRating from './StarRating';
import Badge from './ui/Badge';
import { Avatar } from './ui/Brand';
import { formatDate, timeAgo } from '../utils/format';

export default function ReviewList({ reviews, currentUserId }) {
  return (
    <ul className="space-y-3">
      {reviews.map((r, i) => {
        const name = r.user?.name || 'Customer';
        const mine = currentUserId && r.user?._id === currentUserId;
        return (
          <li
            key={r._id}
            className={`animate-fade-up rounded-2xl border bg-white p-5 shadow-card transition hover:shadow-lift ${mine ? 'border-brand-200' : 'border-stone-200/80'}`}
            style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
          >
            <div className="flex items-start gap-3.5">
              <Avatar name={name} className="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {name}
                    {mine && <Badge tone="brand">Your review</Badge>}
                  </span>
                  <time className="text-xs text-slate-400" dateTime={r.createdAt} title={formatDate(r.createdAt)}>
                    {timeAgo(r.createdAt)}
                  </time>
                </div>
                <div className="mt-1">
                  <StarRating value={r.rating} size={14} />
                </div>
              </div>
            </div>
            {r.comment ? (
              <p className="mt-3.5 text-sm leading-relaxed text-pretty text-slate-600">{r.comment}</p>
            ) : (
              <p className="mt-3.5 text-sm text-slate-400 italic">Rated without a written review.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
