'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, MailIcon, ShieldIcon, SparkIcon, NoteIcon } from '@/components/icons';
import { Alert, Avatar, PasswordInput } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEMO_PASSWORD, demoAccounts } from '@/lib/demo';
import { ApiError } from '@/lib/types';

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) {
    return `Cannot reach the API at ${API_URL}. Check that the backend is running and allows this site (CORS).`;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Login failed';
}

const highlights = [
  { icon: <NoteIcon size={18} />, text: 'Private notes only you can edit' },
  { icon: <ShieldIcon size={18} />, text: 'Rotating, revocable sessions' },
  { icon: <SparkIcon size={18} />, text: 'Admin insights across users' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoEmail, setDemoEmail] = useState<string | null>(null);
  // Server-rendered buttons ignore clicks until React hydrates; keep them disabled until then.
  const [interactive, setInteractive] = useState(false);

  useEffect(() => setInteractive(true), []);

  useEffect(() => {
    if (!loading && user) router.replace('/notes');
  }, [loading, user, router]);

  async function signIn(loginEmail: string, loginPassword: string) {
    setError(null);
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      router.replace('/notes');
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
      setDemoEmail(null);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await signIn(email, password);
  }

  async function onDemo(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setDemoEmail(accountEmail);
    await signIn(accountEmail, DEMO_PASSWORD);
  }

  return (
    <div className="login-screen">
      <section className="login-visual" aria-label="About Secure Notes">
        <div className="login-media" aria-hidden>
          <div className="login-shot login-shot-main">
            <Image src="/login/notebook.jpg" alt="" fill priority sizes="(max-width: 960px) 100vw, 40vw" />
          </div>
          <div className="login-shot login-shot-side">
            <Image src="/login/notes.jpg" alt="" fill sizes="(max-width: 960px) 50vw, 20vw" />
          </div>
          <div className="login-shot login-shot-tall">
            <Image src="/login/desk.jpg" alt="" fill sizes="(max-width: 960px) 50vw, 20vw" />
          </div>
        </div>

        <div className="login-visual-inner">
          <span className="login-badge">
            <LockIcon size={14} /> Secure, revocable sessions
          </span>
          <h1>
            Your thoughts,
            <br />
            <span className="gradient-text">safely kept.</span>
          </h1>
          <p>A calm, private space for notes and posts — with admin tools built in.</p>
          <ul className="login-highlights">
            {highlights.map((item) => (
              <li key={item.text}>
                <span>{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-brand">
            <span className="brand-mark" aria-hidden />
            <span className="brand-name">Secure Notes</span>
          </div>
          <div className="login-card-head">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your workspace.</p>
          </div>

          {error && <Alert>{error}</Alert>}

          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <MailIcon size={18} />
              <input
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting || !interactive}>
            {submitting && !demoEmail ? <span className="btn-spinner" aria-hidden /> : null}
            {submitting && !demoEmail ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-divider">
            <span>or try a demo account</span>
          </div>

          <div className="demo-list">
            {demoAccounts.map((account, i) => (
              <button
                key={account.email}
                type="button"
                className="demo-account"
                style={{ '--i': i } as React.CSSProperties}
                disabled={submitting || !interactive}
                onClick={() => onDemo(account.email)}
              >
                <Avatar name={account.name} size="sm" />
                <span className="demo-account-text">
                  <strong>
                    {account.name}
                    <span className={`badge ${account.role === 'Admin' ? 'badge-admin' : ''}`}>{account.role}</span>
                  </strong>
                  <span>{account.tagline}</span>
                </span>
                {demoEmail === account.email ? (
                  <span className="btn-spinner demo-spinner" aria-hidden />
                ) : (
                  <span className="demo-go" aria-hidden>
                    →
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="demo-note">
            Demo password: <code>{DEMO_PASSWORD}</code>
          </p>

          <p className="login-foot">
            <ShieldIcon size={14} /> Sessions refresh securely and can be revoked at any time.
          </p>
        </form>
      </section>
    </div>
  );
}
