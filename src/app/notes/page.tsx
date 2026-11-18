'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/guards';
import { ActivityIcon, ClockIcon, EditIcon, NoteIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import {
  Alert,
  EmptyState,
  Modal,
  NoteCardSkeleton,
  StatCard,
  StatsSkeleton,
  stagger,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { relativeTime } from '@/lib/format';
import { ApiError, type Note, type Paginated } from '@/lib/types';

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesContent />
    </RequireAuth>
  );
}

const PAGE_SIZE = 6;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function NotesContent() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Note> | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (nextPage: number) => {
    setError(null);
    try {
      const data = await api<Paginated<Note>>('/notes', { query: { page: nextPage, limit: PAGE_SIZE } });
      setResult(data);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notes');
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/notes', { method: 'POST', body: { title, content } });
      setTitle('');
      setContent('');
      setPage(1);
      await load(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create note');
    } finally {
      setBusy(false);
    }
  }

  function openEdit(note: Note) {
    setEditing(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/notes/${editing._id}`, {
        method: 'PATCH',
        body: { title: editTitle, content: editContent },
      });
      setEditing(null);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update note');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/notes/${id}`, { method: 'DELETE' });
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete note');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page-enter">
      <section className="hero-banner">
        <div className="hero-aurora" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="hero-content">
          <span className="eyebrow eyebrow-light">My notes</span>
          <h1>
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p>Private notes only you can edit. Admins can view them, but never change them.</p>
        </div>
        <a href="#new-note" className="btn btn-glass hero-cta">
          <PlusIcon size={16} /> New note
        </a>
      </section>

      {result ? (
        <div className="stats-grid">
          <StatCard index={0} icon={<NoteIcon />} label="Total notes" value={result.total} hint="Across all pages" />
          <StatCard
            index={1}
            tone="violet"
            icon={<ActivityIcon />}
            label="On this page"
            value={result.data.length}
            hint={`Page ${result.page} of ${Math.max(result.totalPages, 1)}`}
          />
          <StatCard
            index={2}
            tone="teal"
            icon={<ClockIcon />}
            label="Last edited"
            value={result.data[0] ? relativeTime(result.data[0].updatedAt) : '—'}
            hint={result.data[0]?.title ?? 'Nothing yet'}
          />
        </div>
      ) : (
        <StatsSkeleton />
      )}

      {error && <Alert>{error}</Alert>}

      <div className="split">
        <form className="card composer" id="new-note" onSubmit={onCreate}>
          <div className="card-title">
            <span className="card-title-icon">
              <PlusIcon size={18} />
            </span>
            <h2>New note</h2>
          </div>
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a short title"
              required
              maxLength={200}
            />
          </label>
          <label className="field">
            <span>Content</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something worth remembering…"
              maxLength={10000}
              rows={6}
            />
          </label>
          <div className="composer-foot">
            <span className="hint">{content.length.toLocaleString()} / 10,000</span>
            <button className="btn btn-primary" type="submit" disabled={busy || !title.trim()}>
              <PlusIcon size={16} /> Add note
            </button>
          </div>
        </form>

        <section className="stack" aria-label="Your notes">
          <div className="grid-cards">
            {!result && Array.from({ length: 4 }, (_, i) => <NoteCardSkeleton key={i} />)}
            {result?.data.map((note, i) => (
              <article key={note._id} className="card note-card" style={stagger(i)}>
                <div className="note-card-head">
                  <h3>{note.title}</h3>
                  <div className="note-actions">
                    <button type="button" className="icon-btn" aria-label="Edit note" onClick={() => openEdit(note)}>
                      <EditIcon size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label="Delete note"
                      disabled={busy}
                      onClick={() => onDelete(note._id)}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
                <p className="note-body">{note.content || <span className="muted">No content</span>}</p>
                <span className="meta">Updated {relativeTime(note.updatedAt)}</span>
              </article>
            ))}
          </div>
          {result && result.data.length === 0 && (
            <EmptyState icon={<NoteIcon size={28} />} title="No notes yet">
              Write your first note using the form — it will appear here.
            </EmptyState>
          )}
          {result && (
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} />
          )}
        </section>
      </div>

      <Modal open={!!editing} title="Edit note" onClose={() => setEditing(null)}>
        <form className="stack" onSubmit={onSaveEdit}>
          <label className="field">
            <span>Title</span>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required maxLength={200} />
          </label>
          <label className="field">
            <span>Content</span>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={8} maxLength={10000} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Save changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
