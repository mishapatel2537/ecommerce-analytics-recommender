import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';

/** <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: 'Cart' }]} /> (last item = current page) */
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && <Icon name="chevronRight" className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
              <li className={last ? 'min-w-0 truncate font-medium text-slate-900' : 'shrink-0'} aria-current={last ? 'page' : undefined}>
                {item.to && !last ? (
                  <Link to={item.to} className="transition hover:text-slate-900">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page title block used by customer pages */
export default function PageHeader({ eyebrow, title, description, breadcrumbs, actions, className = '' }) {
  return (
    <header className={`animate-fade-up ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className={`flex flex-wrap items-end justify-between gap-4 ${breadcrumbs ? 'mt-4' : ''}`}>
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-xs font-semibold tracking-wider text-brand-600 uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-slate-500 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
