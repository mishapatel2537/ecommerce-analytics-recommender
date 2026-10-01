import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import Button from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/Field';
import { useToast } from '../components/Toast';
import { AuthLayout, ErrorBox } from './Login';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 0-3: length, mixed case / digits, symbols
function strength(pw) {
  if (!pw) return 0;
  let s = pw.length >= 6 ? 1 : 0;
  if (pw.length >= 10) s += 1;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(3, s);
}
const STRENGTH = [
  { label: 'Too short', bar: 'bg-rose-400', text: 'text-rose-600' },
  { label: 'Okay', bar: 'bg-amber-400', text: 'text-amber-700' },
  { label: 'Good', bar: 'bg-emerald-400', text: 'text-emerald-700' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-700' },
];

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const errors = {
    name: form.name.trim().length < 2 ? 'Enter your name' : '',
    email: !form.email ? 'Enter your email' : !EMAIL_RE.test(form.email) ? 'Enter a valid email address' : '',
    password: form.password.length < 6 ? 'Use at least 6 characters' : '',
    confirm: !form.confirm ? 'Repeat your password' : form.confirm !== form.password ? 'Passwords do not match' : '',
  };
  const show = (k) => (touched[k] ? errors[k] : '');
  const level = strength(form.password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.values(errors).some(Boolean)) return;
    setError('');
    setSubmitting(true);
    try {
      const created = await signup(form.name.trim(), form.email, form.password);
      toast({ title: `Welcome, ${created.name.split(' ')[0]}!`, text: 'Your account is ready.' });
      navigate('/shop', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Signup failed'));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join in seconds and start shopping."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorBox>{error}</ErrorBox>}
        <TextField
          label="Full name"
          icon="user"
          name="name"
          autoComplete="name"
          placeholder="Asha Rao"
          value={form.name}
          onChange={handleChange}
          onBlur={blur}
          error={show('name')}
        />
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
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange}
            onBlur={blur}
            error={show('password')}
          />
          {form.password && !show('password') && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="grid flex-1 grid-cols-3 gap-1.5">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`h-1 rounded-full transition-colors duration-300 ${level >= n ? STRENGTH[level].bar : 'bg-stone-200'}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${STRENGTH[level].text}`}>{STRENGTH[level].label}</span>
            </div>
          )}
        </div>
        <PasswordField
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={handleChange}
          onBlur={blur}
          error={show('confirm')}
        />
        <div className="pt-2">
          <Button type="submit" size="lg" block loading={submitting} iconRight="arrowRight">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500">New accounts are customer accounts.</p>
      </form>
    </AuthLayout>
  );
}
