import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';

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
    <AuthCard title="Log in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
        />
        <SubmitButton disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        New here?{' '}
        <Link to="/signup" className="font-medium text-blue-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

// Small building blocks shared with Signup.jsx
export function AuthCard({ title, children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        required
        {...props}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
      />
    </label>
  );
}

export function SubmitButton({ children, ...props }) {
  return (
    <button
      type="submit"
      {...props}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ErrorBox({ children }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </div>
  );
}
