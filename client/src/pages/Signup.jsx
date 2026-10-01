import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import { AuthLayout, ErrorBox, Field, SubmitButton } from './Login';

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/', { replace: true });
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
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Full name" icon="user" name="name" autoComplete="name" placeholder="Asha Rao" value={form.name} onChange={handleChange} />
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
          autoComplete="new-password"
          minLength={6}
          placeholder="At least 6 characters"
          value={form.password}
          onChange={handleChange}
        />
        <Field
          label="Confirm password"
          icon="lock"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={handleChange}
        />
        <div className="pt-1">
          <SubmitButton disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}
