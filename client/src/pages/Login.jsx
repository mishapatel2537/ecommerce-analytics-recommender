import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/Field';
import { Logo } from '../components/ui/Brand';
import { useToast } from '../components/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const errors = {
    email: !form.email ? 'Enter your email' : !EMAIL_RE.test(form.email) ? 'Enter a valid email address' : '',
    password: !form.password ? 'Enter your password' : '',
  };
  const show = (k) => (touched[k] ? errors[k] : '');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email, form.password);
      toast({ title: `Welcome back, ${loggedIn.name.split(' ')[0]}`, text: loggedIn.role === 'admin' ? 'Opening your dashboard' : 'Happy shopping' });
      // Return to the page that asked for login, unless that was just the landing page
      const from = location.state?.from;
      const back = from && from.pathname !== '/' ? `${from.pathname}${from.search || ''}` : null;
      navigate(back || homeFor(loggedIn), { replace: true });
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
          <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-900">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <ErrorBox>{error}</ErrorBox>}
        <TextField
          label="Email"
          icon="mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          onBlur={blur}
          error={show('email')}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          onBlur={blur}
          error={show('password')}
        />
        <Button type="submit" size="lg" block loading={submitting} iconRight="arrowRight">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---------- Building blocks shared with Signup.jsx ----------

const FEATURES = [
  { icon: 'search', title: 'Smart search & filters', text: 'Find products by name, category, price and stock.' },
  { icon: 'sparkles', title: '“Customers also bought”', text: 'Suggestions mined from real co-purchase patterns.' },
  { icon: 'chart', title: 'Live sales analytics', text: 'Revenue trends and segments from MongoDB aggregation.' },
];

const MOSAIC = ['laptop-pro-14', 'coffee-maker', 'running-shoes', 'yoga-mat', 'ceramic-mug-set', 'atomic-habits'];

export function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* Form panel */}
      <main className="relative flex flex-col bg-white px-6 py-8 sm:px-10">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_40%)]" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <Logo />
          <Link to="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:text-slate-900">
            <Icon name="arrowLeft" className="h-4 w-4" /> Back to home
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>}
          </div>
        </div>
        <p className="relative text-center text-xs text-slate-400">Passwords are hashed with bcrypt; sessions use signed JWTs.</p>
      </main>

      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 grid grid-cols-3 gap-3 p-3 opacity-35" aria-hidden="true">
          {MOSAIC.map((slug, i) => (
            <img
              key={slug}
              src={`/products/${slug}.webp`}
              alt=""
              className={`h-full w-full animate-fade-in rounded-2xl object-cover ${i % 2 ? 'translate-y-10' : ''}`}
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15 backdrop-blur">
            <Icon name="bolt" className="h-3.5 w-3.5" /> MERN · MongoDB aggregation
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-white">Shop smarter. See the numbers behind every sale.</h2>
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="flex animate-fade-up gap-4" style={{ animationDelay: `${200 + i * 100}ms` }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-white">{f.title}</div>
                  <div className="text-sm text-slate-300">{f.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-400">Web Development + Advanced DBMS mini project</p>
      </aside>
    </div>
  );
}

export function ErrorBox({ children }) {
  return (
    <div role="alert" className="flex animate-scale-in items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
