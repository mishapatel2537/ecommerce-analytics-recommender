import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';

const MenuContext = createContext(() => {});

/**
 * Dropdown menu with keyboard support (arrows, Home/End, Escape).
 * <Menu label="Account" button={<Avatar .../>}>
 *   <MenuItem to="/orders" icon="cube">Orders</MenuItem>
 *   <MenuItem onClick={logout} icon="logout">Log out</MenuItem>
 * </Menu>
 */
export default function Menu({ button, label, header, align = 'right', buttonClassName = '', children }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const btn = useRef(null);
  const list = useRef(null);
  const id = useId();

  const items = () => [...(list.current?.querySelectorAll('[role="menuitem"]') || [])];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    requestAnimationFrame(() => items()[0]?.focus());
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };

  const onKeyDown = (e) => {
    const all = items();
    const i = all.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      all[(i + 1) % all.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      all[(i - 1 + all.length) % all.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      all[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      all[all.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'ArrowDown' && (e.preventDefault(), setOpen(true))}
        className={`flex items-center rounded-xl transition hover:bg-stone-100 ${open ? 'bg-stone-100' : ''} ${buttonClassName}`}
      >
        {button}
      </button>
      {open && (
        <div
          ref={list}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`absolute top-full z-50 mt-2 w-60 origin-top-right animate-scale-in rounded-2xl border border-stone-200 bg-white p-1.5 shadow-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {header && <div className="border-b border-stone-100 px-3 pt-2 pb-3">{header}</div>}
          <MenuContext.Provider value={() => close(false)}>
            <div className={header ? 'pt-1.5' : ''}>{children}</div>
          </MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

export function MenuItem({ to, onClick, icon, tone = 'default', children }) {
  const close = useContext(MenuContext);
  const cls = `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition focus:outline-none ${
    tone === 'danger'
      ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700'
      : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900 focus:bg-stone-100 focus:text-slate-900'
  }`;
  const content = (
    <>
      {icon && <Icon name={icon} className="h-4.5 w-4.5 text-slate-400" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link role="menuitem" tabIndex={-1} to={to} onClick={close} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button
      role="menuitem"
      tabIndex={-1}
      type="button"
      onClick={() => {
        close();
        onClick?.();
      }}
      className={cls}
    >
      {content}
    </button>
  );
}
