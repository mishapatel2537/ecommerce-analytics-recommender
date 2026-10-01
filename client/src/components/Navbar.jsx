import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export function Logo({ dark = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        <Icon name="logo" className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      <span className={`text-[15px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
        E-commerce <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Analytics</span>
      </span>
    </Link>
  );
}

export function Avatar({ name, className = 'h-8 w-8 text-xs' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
    >
      {initials}
    </span>
  );
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/login');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>
        <Icon name="store" className="h-4 w-4" /> Shop
      </NavLink>
      {/* Person B: add Cart / Orders links here */}
      {isAdmin && (
        <NavLink to="/admin" className={linkClass} onClick={close}>
          <Icon name="chart" className="h-4 w-4" /> Dashboard
        </NavLink>
      )}
    </>
  );

  const account = user ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={user.name} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-800">{user.name}</div>
          <div className="text-xs text-slate-500">{isAdmin ? 'Administrator' : 'Customer'}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        title="Log out"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <Icon name="logout" className="h-4 w-4" />
        <span className="md:sr-only lg:not-sr-only">Log out</span>
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link to="/login" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        Log in
      </Link>
      <Link
        to="/signup"
        onClick={close}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Get started
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">{links}</div>
        </div>
        <div className="hidden md:block">{account}</div>

        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links}
          <hr className="my-2 border-slate-200" />
          {account}
        </div>
      )}
    </header>
  );
}
