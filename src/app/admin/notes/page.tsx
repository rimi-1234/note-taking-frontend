'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAdmin } from '@/components/guards';
import { ActivityIcon, LayersIcon, UsersIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import {
  Alert,
  Avatar,
  EmptyState,
  NoteCardSkeleton,
  PageHeader,
  StatCard,
  StatsSkeleton,
  stagger,
} from '@/components/ui';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
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
        const data = await api<Paginated<PublicUser>>('/admin/users', { query: { page: 1, limit: 100 } });
        setUsers(data.data);
      } catch {
        // The notes list still works without the owner dropdown.
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const data = await api<Paginated<AdminNote>>('/admin/notes', {
          query: { page, limit: 9, owner: owner || undefined },
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load notes');
      }
    })();
  }, [page, owner]);

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Admin"
        title="All notes"
        description="A read-only view of every user's notes."
        actions={
          <label className="toolbar-select">
            <span className="sr-only">Filter by owner</span>
            <select
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All owners</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {result ? (
        <div className="stats-grid">
          <StatCard
            index={0}
            icon={<LayersIcon />}
            label={owner ? 'Notes by owner' : 'Total notes'}
            value={result.total}
            hint={owner ? users.find((u) => u._id === owner)?.name ?? 'Filtered' : 'Every user'}
          />
          <StatCard
            index={1}
            tone="violet"
            icon={<UsersIcon />}
            label="Authors here"
            value={new Set(result.data.map((n) => n.owner._id)).size}
            hint="On this page"
          />
          <StatCard
            index={2}
            tone="teal"
            icon={<ActivityIcon />}
            label="Showing"
            value={result.data.length}
            hint={`Page ${result.page} of ${Math.max(result.totalPages, 1)}`}
          />
        </div>
      ) : (
        <StatsSkeleton />
      )}

      {error && <Alert>{error}</Alert>}

      <div className="grid-cards grid-cards-3">
        {!result && Array.from({ length: 6 }, (_, i) => <NoteCardSkeleton key={i} withOwner />)}
        {result?.data.map((note, i) => (
          <article key={note._id} className="card note-card" style={stagger(i)}>
            <h3>{note.title}</h3>
            <p className="note-body clamp">{note.content || <span className="muted">No content</span>}</p>
            <Link href={`/users/${note.owner._id}/posts`} className="owner-line">
              <Avatar name={note.owner.name} size="sm" />
              <span>
                <strong>{note.owner.name}</strong>
                <span className="meta">{relativeTime(note.updatedAt)}</span>
              </span>
            </Link>
          </article>
        ))}
      </div>
      {result && result.data.length === 0 && (
        <EmptyState icon={<LayersIcon size={28} />} title="No notes found">
          {owner ? 'This user has no notes yet.' : 'Nobody has written a note yet.'}
        </EmptyState>
      )}
      {result && (
        <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} />
      )}
    </div>
  );
}
