import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Toast notifications for quick feedback (added to cart, review posted, ...).
 *   const toast = useToast();
 *   toast({ title: 'Added to cart', text: 'Yoga Mat × 1', action: { to: '/cart', label: 'View cart' } });
 *   toast({ tone: 'info', title: 'Removed', action: { label: 'Undo', onClick: undo } });
 * tone: 'success' | 'error' | 'info'
 */
const ToastContext = createContext(() => {});

const TONES = {
  success: { icon: 'check', cls: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'bg-emerald-400' },
  error: { icon: 'alert', cls: 'bg-rose-50 text-rose-600 ring-rose-100', bar: 'bg-rose-400' },
  info: { icon: 'info', cls: 'bg-stone-100 text-slate-600 ring-stone-200', bar: 'bg-slate-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, text, tone = 'success', action, duration = 4000 }) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, title, text, tone, action, duration }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 sm:items-stretch"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.success;
          return (
            <div
              key={t.id}
              className="pointer-events-auto relative flex w-full animate-fade-up items-start gap-3 overflow-hidden rounded-2xl border border-stone-200 bg-white/95 p-3.5 shadow-pop backdrop-blur"
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${tone.cls}`}>
                <Icon name={tone.icon} className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.text && <p className="mt-0.5 truncate text-sm text-slate-500">{t.text}</p>}
              </div>
              {t.action &&
                (t.action.to ? (
                  <Link
                    to={t.action.to}
                    onClick={() => dismiss(t.id)}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    {t.action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      dismiss(t.id);
                      t.action.onClick();
                    }}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    {t.action.label}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
              {/* Time left */}
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-0 h-0.5 origin-left ${tone.bar} opacity-60`}
                style={{ width: '100%', animation: `toast-timer ${t.duration}ms linear forwards` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
