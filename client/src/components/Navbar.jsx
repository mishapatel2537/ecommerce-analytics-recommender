import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Products
      </NavLink>
      {/* Person B: add Cart / Orders links here */}
      {isAdmin && (
        <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
          Dashboard
        </NavLink>
      )}
    </>
  );

  const account = user ? (
    <>
      <span className="px-3 py-2 text-sm text-gray-500">
        Hi, <span className="font-medium text-gray-800">{user.name}</span>
        {isAdmin && <span className="ml-2 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white">admin</span>}
      </span>
      <button
        onClick={handleLogout}
        className="rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
        Log in
      </NavLink>
      <Link
        to="/signup"
        onClick={() => setOpen(false)}
        className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
      >
        Sign up
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold tracking-tight text-gray-900">
          E-commerce <span className="text-blue-600">Analytics</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">{links}</div>
        <div className="hidden items-center gap-1 md:flex">{account}</div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 md:hidden">
          {links}
          <hr className="my-2 border-gray-200" />
          {account}
        </div>
      )}
    </header>
  );
}
