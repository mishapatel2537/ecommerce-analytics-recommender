import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import Icon from '../components/Icon';
import { Logo } from '../components/Navbar';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email, form.password);
      const from = location.state?.from?.pathname;
      navigate(from || (loggedIn.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue shopping or open your dashboard."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field
          label="Email"
          icon="mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
        />
        <Field
          label="Password"
          icon="lock"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
        />
        <SubmitButton disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</SubmitButton>
      </form>
    </AuthLayout>
  );
}

// ---------- Building blocks shared with Signup.jsx ----------

const FEATURES = [
  { icon: 'search', title: 'Smart search & filters', text: 'Find products by name, category, price and stock.' },
  { icon: 'chart', title: 'Live sales analytics', text: 'Admins track revenue trends powered by MongoDB aggregation.' },
  { icon: 'shield', title: 'Secure accounts', text: 'Passwords hashed with bcrypt, sessions signed with JWT.' },
];

export function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <img src="/products/laptop-pro-14.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/70" />

        <div className="relative">
          <Logo dark />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight text-white">Shop smarter. See the numbers behind every sale.</h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-medium text-white">{f.title}</div>
                  <div className="text-sm text-slate-300">{f.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-400">MERN · Web Development + Advanced DBMS mini project</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>}
          <p className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
              ← Back to shop
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export function Field({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <span className="relative block">
        {icon && <Icon name={icon} className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <input
          required
          {...props}
          className={`w-full rounded-xl border border-stone-300 bg-white py-2.5 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-stone-200 focus:outline-none ${
            icon ? 'pl-11' : 'pl-3.5'
          }`}
        />
      </span>
    </label>
  );
}

export function SubmitButton({ children, ...props }) {
  return (
    <button
      type="submit"
      {...props}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ErrorBox({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
