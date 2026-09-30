import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import { AuthCard, ErrorBox, Field, SubmitButton } from './Login';

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
    <AuthCard title="Create an account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Name" name="name" autoComplete="name" value={form.name} onChange={handleChange} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={form.password}
          onChange={handleChange}
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
        />
        <SubmitButton disabled={submitting}>{submitting ? 'Creating account…' : 'Sign up'}</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
