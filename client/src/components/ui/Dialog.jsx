import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Button';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const PANELS = {
  modal: 'relative m-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl bg-white shadow-pop',
  right: 'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-pop',
  left: 'absolute inset-y-0 left-0 flex w-[85vw] max-w-xs flex-col bg-white shadow-pop',
  bottom: 'absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-pop',
};
const ENTER = { modal: 'animate-scale-in', right: 'animate-slide-in-right', left: 'animate-slide-in-left', bottom: 'animate-slide-up' };
const EXIT = {
  modal: 'scale-95 opacity-0',
  right: 'translate-x-full',
  left: '-translate-x-full',
  bottom: 'translate-y-full',
};
const WIDTHS = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Accessible dialog: traps focus, closes on Escape / backdrop, locks page scroll,
 * and returns focus to whatever opened it.
 *
 *   <Dialog open={open} onClose={close} title="Write a review">...</Dialog>
 *   variant: 'modal' (centred) | 'right' / 'left' (drawers) | 'bottom' (mobile sheet)
 */
export default function Dialog({ open, onClose, title, description, variant = 'modal', size = 'md', footer, hideHeader = false, children }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const returnFocus = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Keep it mounted briefly after close so the exit transition can play
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const id = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 200);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Focus the first field, else the panel itself
    const t = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      // Drawers and sheets focus the panel, so phones don't pop the keyboard open
      const preferred = panel.querySelector('[data-autofocus]') || (variant === 'modal' ? panel.querySelector('input, textarea, select') : null);
      (preferred || panel).focus({ preventScroll: true });
    }, 30);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${variant === 'modal' ? 'p-4' : ''}`} onKeyDown={onKeyDown}>
      <div
        className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${closing ? 'opacity-0' : 'animate-fade-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`${PANELS[variant]} ${variant === 'modal' ? WIDTHS[size] : ''} transition duration-200 ease-out focus:outline-none ${
          closing ? EXIT[variant] : ENTER[variant]
        }`}
      >
        {variant === 'bottom' && <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-stone-300" aria-hidden="true" />}
        {!hideHeader && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200/80 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            <IconButton icon="close" label="Close" size="sm" onClick={onClose} className="-mr-1.5" />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-stone-200/80 bg-stone-50/60 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
