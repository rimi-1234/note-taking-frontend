'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAdmin } from '@/components/guards';
import { Pagination } from '@/components/pagination';
import { api } from '@/lib/api';
import { ApiError, type Note, type Paginated, type PublicUser } from '@/lib/types';

type AdminNote = Note & {
  owner: { _id: string; name: string; email: string };
};

export default function AdminNotesPage() {
  return (
    <RequireAdmin>
      <AdminNotesContent />
    </RequireAdmin>
  );
}

function AdminNotesContent() {
  const [page, setPage] = useState(1);
  const [owner, setOwner] = useState('');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [result, setResult] = useState<Paginated<AdminNote> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api<Paginated<PublicUser>>('/admin/users', {
          query: { page: 1, limit: 100 },
        });
        setUsers(data.data);
      } catch {
        // Filter still works if typed manually; ignore list failure.
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const data = await api<Paginated<AdminNote>>('/admin/notes', {
          query: { page, limit: 10, owner: owner || undefined },
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load notes');
      }
    })();
  }, [page, owner]);

  return (
    <div className="stack page-enter">
      <section className="panel stack">
        <div className="page-head">
          <h1>Admin · All notes</h1>
          <p className="muted">View-only. Filtering uses the owner index.</p>
        </div>
        {error && <div className="error">{error}</div>}
        <label>
          Filter by owner
          <select
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel stack">
        <div className="list">
          {result?.data.map((note) => (
            <article key={note._id} className="card">
              <h3>{note.title}</h3>
              <p>{note.content || <span className="muted">(empty)</span>}</p>
              <p className="muted">
                Owner:{' '}
                <Link href={`/users/${note.owner._id}/posts`}>
                  {note.owner.name} ({note.owner.email})
                </Link>
              </p>
            </article>
          ))}
          {result && result.data.length === 0 && <p className="muted">No notes.</p>}
        </div>
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}
