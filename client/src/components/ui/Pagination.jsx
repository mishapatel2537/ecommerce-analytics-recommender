import Icon from '../Icon';

// 1 … 4 5 [6] 7 8 … 12
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

function PageButton({ children, active, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold tabular-nums transition duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-white text-slate-700 shadow-card ring-1 ring-stone-200 hover:-translate-y-px hover:ring-stone-300 disabled:hover:translate-y-0'
      }`}
    >
      {children}
    </button>
  );
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageButton disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <Icon name="chevronLeft" className="h-4 w-4" />
      </PageButton>
      {pageList(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1.5 text-slate-400" aria-hidden="true">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}>
            {p}
          </PageButton>
        )
      )}
      <PageButton disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <Icon name="chevronRight" className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}
