'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/guards';
import { CrownIcon, EditIcon, PlusIcon, PostIcon, TrashIcon, UserIcon, UsersIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import {
  Alert,
  Avatar,
  EmptyState,
  Modal,
  PageHeader,
  PasswordInput,
  StatCard,
  StatsSkeleton,
  UserRowSkeleton,
  stagger,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isDemoAccount } from '@/lib/demo';
import { parseList } from '@/lib/format';
import { ApiError, type Paginated, type PublicUser, type UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AdminUsersContent />
    </RequireAdmin>
  );
}

type FormState = { name: string; email: string; password: string; role: UserRole; interests: string };
const emptyForm: FormState = { name: '', email: '', password: '', role: 'user', interests: '' };

function AdminUsersContent() {
  const { user: me } = useAuth();
  const readOnly = isDemoAccount(me?.email);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<PublicUser> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async (nextPage: number) => {
    setError(null);
    try {
      const data = await api<Paginated<PublicUser>>('/admin/users', { query: { page: nextPage, limit: 10 } });
      setResult(data);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setFormError(null);
    setMode('create');
  }

  function openEdit(u: PublicUser) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, interests: u.interests.join(', ') });
    setEditId(u._id);
    setFormError(null);
    setMode('edit');
  }

  const closeModal = useCallback(() => setMode(null), []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (mode === 'create') {
        await api('/admin/users', {
          method: 'POST',
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            interests: parseList(form.interests),
          },
        });
        setPage(1);
        await load(1);
      } else if (editId) {
        const body: Record<string, unknown> = {
          name: form.name.trim(),
          role: form.role,
          interests: parseList(form.interests),
        };
        if (form.password.trim()) body.password = form.password.trim();
        await api(`/admin/users/${editId}`, { method: 'PATCH', body });
        await load(page);
      }
      setMode(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(u: PublicUser) {
    if (!confirm(`Delete ${u.name}? Their notes and posts will be deleted too.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/users/${u._id}`, { method: 'DELETE' });
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Create accounts, change roles, and remove users along with their content."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate} disabled={readOnly}>
            <PlusIcon size={16} /> New user
          </button>
        }
      />

      {readOnly && (
        <div className="notice">
          <strong>Demo mode.</strong> You can explore every admin page, but creating, editing and deleting users is
          turned off for the demo admin.
        </div>
      )}

      {result ? (
        <div className="stats-grid">
          <StatCard index={0} icon={<UsersIcon />} label="Total users" value={result.total} hint="All accounts" />
          <StatCard
            index={1}
            tone="amber"
            icon={<CrownIcon />}
            label="Admins"
            value={result.data.filter((u) => u.role === 'admin').length}
            hint="On this page"
          />
          <StatCard
            index={2}
            tone="teal"
            icon={<UserIcon />}
            label="Members"
            value={result.data.filter((u) => u.role === 'user').length}
            hint="On this page"
          />
        </div>
      ) : (
        <StatsSkeleton />
      )}

      {error && <Alert>{error}</Alert>}

      <section className="card table-card">
        <div className="table-head">
          <h2>All users</h2>
          <span className="meta">{result ? `${result.total} total` : '\u00a0'}</span>
        </div>

        <div className="user-rows">
          <div className="user-row user-row-head" aria-hidden>
            <span>User</span>
            <span>Role</span>
            <span>Interests</span>
            <span />
          </div>
          {!result && Array.from({ length: 5 }, (_, i) => <UserRowSkeleton key={i} />)}
          {result?.data.map((u, i) => (
            <div key={u._id} className="user-row row-enter" style={stagger(i)}>
              <div className="user-cell">
                <Avatar name={u.name} />
                <div className="user-cell-text">
                  <strong>
                    {u.name}
                    {u._id === me?._id && <span className="you-tag">You</span>}
                  </strong>
                  <span>{u.email}</span>
                </div>
              </div>
              <div>
                <span className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}>{u.role}</span>
              </div>
              <div className="chips">
                {u.interests.length ? (
                  u.interests.map((item) => (
                    <span key={item} className="chip">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="meta">—</span>
                )}
              </div>
              <div className="row-actions">
                <Link href={`/users/${u._id}/posts`} className="icon-btn" aria-label={`View ${u.name}'s posts`} title="Posts">
                  <PostIcon size={18} />
                </Link>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Edit ${u.name}`}
                  title={readOnly ? 'Disabled in demo mode' : 'Edit'}
                  disabled={readOnly}
                  onClick={() => openEdit(u)}
                >
                  <EditIcon size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label={`Delete ${u.name}`}
                  title={readOnly ? 'Disabled in demo mode' : u._id === me?._id ? 'You cannot delete yourself' : 'Delete'}
                  disabled={busy || readOnly || u._id === me?._id}
                  onClick={() => onDelete(u)}
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {result && result.data.length === 0 && (
          <EmptyState icon={<UsersIcon size={28} />} title="No users found" />
        )}
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} />
        )}
      </section>

      <Modal open={mode !== null} title={mode === 'create' ? 'Create user' : 'Edit user'} onClose={closeModal}>
        <form className="stack" onSubmit={onSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                disabled={mode === 'edit'}
              />
            </label>
            <label className="field">
              <span>{mode === 'create' ? 'Password' : 'New password (optional)'}</span>
              <PasswordInput
                value={form.password}
                onChange={(v) => set('password', v)}
                autoComplete="new-password"
                minLength={8}
                required={mode === 'create'}
                placeholder={mode === 'edit' ? 'Leave blank to keep' : 'At least 8 characters'}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Interests</span>
            <input
              value={form.interests}
              onChange={(e) => set('interests', e.target.value)}
              placeholder="chess, coding"
            />
            <small className="hint">Separate with commas.</small>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
