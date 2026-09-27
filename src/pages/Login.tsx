import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { api, describeError } from '@/api/client';
import { useAuth } from '@/features/auth/AuthContext';
import { Logo } from '@/components/layout/Logo';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(identifier, password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-9 col-md-7 col-lg-5">
            <div className="text-center mb-6">
              <Logo className="w-auto h-10 mb-3" />
              <h1 className="h3 mb-1">Welcome back</h1>
              <p className="text-muted mb-0">Sign in to write, moderate and manage.</p>
            </div>

            <form className="card border shadow-none" onSubmit={handleSubmit}>
              <div className="card-body">
                <div className="mb-4">
                  <label className="form-label" htmlFor="identifier">
                    E-mail or username
                  </label>
                  <input
                    id="identifier"
                    className="form-control"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" htmlFor="password">
                      Password
                    </label>
                    <Link className="text-sm" to="/forgot-password">
                      Forgot it?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 text-sm" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary rounded-pill w-100"
                  disabled={busy}
                >
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-muted mt-4 mb-0">
              No account? <Link to="/register">Create one</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', subscribe_newsletter: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function update(field: string, value: unknown) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="container py-10">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-5 text-center">
            <i className="bi bi-envelope-check display-4 text-success" />
            <h1 className="h3 mt-4 mb-2">Check your inbox</h1>
            <p className="text-muted">
              Confirm your e-mail address and you can sign in.
            </p>
            <button className="btn btn-neutral rounded-pill" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-9 col-md-7 col-lg-5">
            <div className="text-center mb-6">
              <Logo className="w-auto h-10 mb-3" />
              <h1 className="h3 mb-1">Create an account</h1>
              <p className="text-muted mb-0">
                Comment, vote in polls and submit posts for review.
              </p>
            </div>

            <form className="card border shadow-none" onSubmit={handleSubmit}>
              <div className="card-body">
                <div className="mb-4">
                  <label className="form-label" htmlFor="full_name">Your name</label>
                  <input id="full_name" className="form-control" value={form.full_name}
                    onChange={(event) => update('full_name', event.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="username">Username</label>
                  <input id="username" className="form-control" value={form.username}
                    onChange={(event) => update('username', event.target.value.toLowerCase())}
                    pattern="[a-z0-9._-]{3,30}" required />
                  <div className="form-text">Lowercase letters, numbers, dots, dashes.</div>
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="r-email">E-mail</label>
                  <input id="r-email" type="email" className="form-control" value={form.email}
                    onChange={(event) => update('email', event.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="r-password">Password</label>
                  <input id="r-password" type="password" className="form-control"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    autoComplete="new-password" minLength={10} required />
                  <div className="form-text">
                    At least 10 characters, with an upper-case letter and a digit.
                  </div>
                </div>

                <div className="form-check mb-4">
                  <input className="form-check-input" type="checkbox" id="newsletter"
                    checked={form.subscribe_newsletter}
                    onChange={(event) => update('subscribe_newsletter', event.target.checked)} />
                  <label className="form-check-label text-sm" htmlFor="newsletter">
                    Send me new posts by e-mail
                  </label>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 text-sm" role="alert">{error}</div>
                )}

                <button type="submit" className="btn btn-primary rounded-pill w-100" disabled={busy}>
                  {busy ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-muted mt-4 mb-0">
              Already have one? <Link to="/login">Sign in</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
