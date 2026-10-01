import { APP_NAME } from '../utils/theme.js';

export default function Header({ view, onView, users, userId, onSignIn, user }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>{APP_NAME}</span>
        </div>

        <nav className="tabs" aria-label="Main">
          <button className={`tab ${view === 'store' ? 'active' : ''}`} onClick={() => onView('store')}>
            Storefront
          </button>
          <button className={`tab ${view === 'admin' ? 'active' : ''}`} onClick={() => onView('admin')}>
            Admin
          </button>
        </nav>

        <label className="account">
          <span className="account-label">Signed in as</span>
          <select value={userId} onChange={(e) => onSignIn(e.target.value)}>
            <option value="">Guest</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}{u.role === 'admin' ? ' (admin)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
