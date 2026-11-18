'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/guards';
import { ClockIcon, CrownIcon, LockIcon, TagIcon, UserIcon } from '@/components/icons';
import { Alert, Avatar, PageHeader, PasswordInput, StatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isDemoAccount } from '@/lib/demo';
import { formatDate, parseList } from '@/lib/format';
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
      const res = await api<{ user: PublicUser }>('/users/me', {
        method: 'PATCH',
        body: { name: name.trim(), interests: parseList(interests) },
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

  const previewInterests = parseList(interests);

  return (
    <div className="page page-enter">
      <PageHeader eyebrow="Account" title="Profile" description="Manage how you appear and keep your account secure." />

      <section className="card profile-hero">
        <Avatar name={user?.name} size="lg" />
        <div className="profile-hero-text">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="chips">
            <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : ''}`}>{user?.role}</span>
            {user?.createdAt && <span className="meta">Member since {formatDate(user.createdAt)}</span>}
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          index={0}
          icon={<TagIcon />}
          label="Interests"
          value={user?.interests.length ?? 0}
          hint={user?.interests.slice(0, 3).join(', ') || 'None added yet'}
        />
        <StatCard
          index={1}
          tone="amber"
          icon={<CrownIcon />}
          label="Role"
          value={user?.role === 'admin' ? 'Admin' : 'Member'}
          hint={user?.role === 'admin' ? 'Full management access' : 'Standard access'}
        />
        <StatCard
          index={2}
          tone="teal"
          icon={<ClockIcon />}
          label="Member since"
          value={user?.createdAt ? formatDate(user.createdAt) : '—'}
          hint="Account created"
        />
      </div>

      {error && <Alert>{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <div className="two-col">
        <form className="card stack" onSubmit={onSaveProfile}>
          <div className="card-title">
            <span className="card-title-icon">
              <UserIcon size={18} />
            </span>
            <h2>Personal details</h2>
          </div>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <span>Interests</span>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="chess, reading, hiking"
            />
            <small className="hint">Separate with commas.</small>
          </label>
          {previewInterests.length > 0 && (
            <div className="chips">
              {previewInterests.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Save profile
            </button>
          </div>
        </form>

        <form className="card stack" onSubmit={onChangePassword}>
          <div className="card-title">
            <span className="card-title-icon">
              <LockIcon size={18} />
            </span>
            <h2>Change password</h2>
          </div>
          {isDemoAccount(user?.email) ? (
            <div className="notice">Password changes are turned off for demo accounts so everyone can keep using them.</div>
          ) : (
            <p className="muted small">For your safety, this signs you out on every device.</p>
          )}
          <label className="field">
            <span>Current password</span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <small className="hint">At least 8 characters.</small>
          </label>
          <div className="form-actions">
            <button className="btn btn-dark" type="submit" disabled={busy || isDemoAccount(user?.email)}>
              Update password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
