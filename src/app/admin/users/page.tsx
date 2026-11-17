'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/guards';
import { Pagination } from '@/components/pagination';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ApiError, type Paginated, type PublicUser, type UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AdminUsersContent />
    </RequireAdmin>
  );
}

function AdminUsersContent() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<PublicUser> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [interests, setInterests] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editInterests, setEditInterests] = useState('');
  const [editPassword, setEditPassword] = useState('');

  async function load(nextPage = page) {
    setError(null);
    try {
      const data = await api<Paginated<PublicUser>>('/admin/users', {
        query: { page: nextPage, limit: 10 },
      });
      setResult(data);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }

  useEffect(() => {
    void load(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/admin/users', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          interests: interests
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setInterests('');
      await load(1);
      setPage(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        role: editRole,
        interests: editInterests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };
      if (editPassword.trim()) body.password = editPassword.trim();
      await api(`/admin/users/${id}`, { method: 'PATCH', body });
      setEditId(null);
      setEditPassword('');
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this user and cascade their notes/posts?')) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel stack">
        <h1>Admin · Users</h1>
        {error && <div className="error">{error}</div>}
        <form className="stack" onSubmit={onCreate}>
          <h2>Create user</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            Interests
            <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="chess, coding" />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            Create
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>All users</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Interests</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result?.data.map((u) => (
                <tr key={u._id}>
                  <td colSpan={editId === u._id ? 5 : undefined}>
                    {editId === u._id ? (
                      <div className="stack">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                        <input
                          value={editInterests}
                          onChange={(e) => setEditInterests(e.target.value)}
                          placeholder="interests"
                        />
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="new password (optional)"
                        />
                        <div className="row">
                          <button className="btn" type="button" disabled={busy} onClick={() => onSaveEdit(u._id)}>
                            Save
                          </button>
                          <button className="btn ghost" type="button" onClick={() => setEditId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div>
                          <strong>{u.name}</strong>
                          <div className="muted">{u.email}</div>
                          <div>
                            <span className="chip">{u.role}</span>{' '}
                            {u.interests.join(', ') || <span className="muted">no interests</span>}
                          </div>
                        </div>
                        <div className="row">
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => {
                              setEditId(u._id);
                              setEditName(u.name);
                              setEditRole(u.role);
                              setEditInterests(u.interests.join(', '));
                              setEditPassword('');
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger"
                            type="button"
                            disabled={busy || u._id === me?._id}
                            onClick={() => onDelete(u._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  {editId === u._id ? null : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}
