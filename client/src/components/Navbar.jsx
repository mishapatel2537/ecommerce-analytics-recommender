import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Icon from './Icon';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import Menu, { MenuItem } from './ui/Menu';
import { Avatar, Logo } from './ui/Brand';

const linkClass = ({ isActive }) =>
  `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
  }`;

// Underline that marks the current page
const ActiveBar = ({ isActive }) => (
  <span
    aria-hidden="true"
    className={`absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-slate-900 transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
  />
);

/** Cart icon with a count badge that pops when the count goes up */
function CartButton({ count, onClick }) {
  const [pop, setPop] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setPop(true);
      const id = setTimeout(() => setPop(false), 400);
      prev.current = count;
      return () => clearTimeout(id);
    }
    prev.current = count;
    return undefined;
  }, [count]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-stone-100 hover:text-slate-900 active:scale-95"
    >
      <Icon name="cart" className="h-5.5 w-5.5" />
      {count > 0 && (
        <span
          className={`absolute top-0.5 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white tabular-nums ${
            pop ? 'animate-pop' : ''
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Navbar search: Enter opens the shop with that search
 * (on the shop page it shows the current search term).
 */
function NavSearch({ className = '', onDone }) {
  const id = useId();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = pathname === '/shop' ? params.get('search') || '' : '';
  const [text, setText] = useState(current);

  useEffect(() => setText(current), [current]);

  const submit = (e) => {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className={`group relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
      <input
        id={id}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search products…"
        className="h-10 w-full rounded-xl border border-transparent bg-stone-100 pr-3 pl-9.5 text-sm text-slate-900 transition placeholder:text-slate-400 hover:bg-stone-200/70 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
      />
    </form>
  );
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation
  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onCart = () => (user ? openCart() : navigate('/login', { state: { from: location } }));

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/85 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled ? 'border-stone-200 shadow-[0_1px_12px_-4px_rgb(28_25_23/0.08)]' : 'border-stone-200/70'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6" aria-label="Main">
        <Logo to={user ? homeFor(user) : '/'} />

        <div className="ml-6 hidden items-center gap-1 md:flex">
          {!user && (
            <NavLink to="/" end className={linkClass}>
              {({ isActive }) => (
                <>
                  Home <ActiveBar isActive={isActive} />
                </>
              )}
            </NavLink>
          )}
          <NavLink to="/shop" className={linkClass}>
            {({ isActive }) => (
              <>
                Shop <ActiveBar isActive={isActive} />
              </>
            )}
          </NavLink>
          {user && (
            <NavLink to="/orders" className={linkClass}>
              {({ isActive }) => (
                <>
                  Orders <ActiveBar isActive={isActive} />
                </>
              )}
            </NavLink>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100"
            >
              <Icon name="chart" className="h-4 w-4" /> Dashboard
            </Link>
          )}
        </div>

        <NavSearch className="mx-auto hidden w-full max-w-sm lg:block" />

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <CartButton count={cartCount} onClick={onCart} />

          {user ? (
            <div className="hidden md:block">
              <Menu
                label="Account menu"
                buttonClassName="gap-2 py-1 pr-2 pl-1"
                button={
                  <>
                    <Avatar name={user.name} className="h-8 w-8 text-xs" />
                    <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-800 lg:block">{user.name.split(' ')[0]}</span>
                    <Icon name="chevronDown" className="h-4 w-4 text-slate-400" />
                  </>
                }
                header={
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} className="h-10 w-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                }
              >
                <MenuItem to="/orders" icon="cube">
                  My orders
                </MenuItem>
                <MenuItem to="/cart" icon="cart">
                  Cart
                </MenuItem>
                {isAdmin && (
                  <MenuItem to="/admin" icon="chart">
                    Admin dashboard
                  </MenuItem>
                )}
                <div className="my-1.5 h-px bg-stone-100" />
                <MenuItem onClick={handleLogout} icon="logout" tone="danger">
                  Log out
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" to="/login" state={{ from: location }}>
                Log in
              </Button>
              <Button to="/signup">Get started</Button>
            </div>
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-stone-100 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} variant="left" hideHeader>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <Logo to={user ? homeFor(user) : '/'} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-stone-100"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 pt-5">
            <NavSearch onDone={() => setMobileOpen(false)} />
          </div>
          <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Mobile">
            {!user && (
              <MobileLink to="/" icon="home" end>
                Home
              </MobileLink>
            )}
            <MobileLink to="/shop" icon="store">
              Shop
            </MobileLink>
            {user && (
              <>
                <MobileLink to="/orders" icon="cube">
                  My orders
                </MobileLink>
                <MobileLink to="/cart" icon="cart" badge={cartCount || null}>
                  Cart
                </MobileLink>
              </>
            )}
            {isAdmin && (
              <MobileLink to="/admin" icon="chart">
                Admin dashboard
              </MobileLink>
            )}
          </nav>
          <div className="border-t border-stone-200 p-5">
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar name={user.name} className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{isAdmin ? 'Administrator' : 'Customer'}</p>
                </div>
                <Button variant="secondary" size="sm" icon="logout" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" to="/login">
                  Log in
                </Button>
                <Button to="/signup">Sign up</Button>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </header>
  );
}

function MobileLink({ to, icon, end, badge, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
          isActive ? 'bg-stone-100 text-slate-900' : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
        }`
      }
    >
      <Icon name={icon} className="h-5 w-5 text-slate-400" />
      <span className="flex-1">{children}</span>
      {badge && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">{badge}</span>}
    </NavLink>
  );
}
