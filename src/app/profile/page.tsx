'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/guards';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ApiError, type PublicUser } from '@/lib/types';

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [interests, setInterests] = useState((user?.interests ?? []).join(', '));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const interestList = interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const res = await api<{ user: PublicUser }>('/users/me', {
        method: 'PATCH',
        body: { name: name.trim(), interests: interestList },
      });
      setUser(res.user);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Password change failed');
      setBusy(false);
    }
  }

  return (
    <div className="stack page-enter">
      <section className="panel stack">
        <div className="page-head">
          <h1>Profile</h1>
          <p className="muted">
            Signed in as <span className="chip">{user?.email}</span> ({user?.role})
          </p>
        </div>
        {error && <div className="error">{error}</div>}
        {message && <p className="muted">{message}</p>}
        <form className="stack" onSubmit={onSaveProfile}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Interests (comma-separated)
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="chess, reading"
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            Save profile
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>Change password</h2>
        <p className="muted">This signs you out everywhere after a successful change.</p>
        <form className="stack" onSubmit={onChangePassword}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New password (min 8)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
