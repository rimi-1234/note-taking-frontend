'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/types';

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) {
    return `Cannot reach the API at ${API_URL}. Check that the backend is running and allows this site (CORS).`;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Login failed';
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin12345!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/notes');
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/notes');
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-visual" aria-label="Brand">
        <div className="login-media" aria-hidden>
          <div className="login-media-grid">
            <div className="login-shot login-shot-main">
              <Image
                src="/login/notebook.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 860px) 100vw, 55vw"
              />
            </div>
            <div className="login-shot login-shot-side">
              <Image src="/login/notes.jpg" alt="" fill sizes="280px" />
            </div>
            <div className="login-shot login-shot-tall">
              <Image src="/login/desk.jpg" alt="" fill sizes="240px" />
            </div>
          </div>
        </div>

        <div className="login-visual-inner">
          <div className="login-mark" aria-hidden />
          <h1>Secure Notes</h1>
          <p>Private notes, rotating sessions, and admin tools — built for calm focus.</p>
        </div>
      </section>

      <section className="login-panel">
        <form className="panel login-card stack" onSubmit={onSubmit}>
          <div>
            <h2>Welcome back</h2>
            <p className="muted lead">Sign in to restore your secure session.</p>
          </div>
          {error && <div className="error">{error}</div>}
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                    />
                    <path
                      fill="currentColor"
                      d="M3.27 2 2 3.27l2.78 2.78A12.8 12.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.7 0 3.3-.34 4.77-.94L19.73 21 21 19.73 3.27 2z"
                      opacity="0.35"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button className="btn" type="submit" disabled={submitting || loading}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}
