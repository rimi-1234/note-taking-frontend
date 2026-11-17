'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/guards';
import { Pagination } from '@/components/pagination';
import { api } from '@/lib/api';
import { ApiError, type Note, type Paginated } from '@/lib/types';

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesContent />
    </RequireAuth>
  );
}

function NotesContent() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Note> | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (nextPage = page) => {
    setError(null);
    try {
      const data = await api<Paginated<Note>>('/notes', { query: { page: nextPage, limit: 5 } });
      setResult(data);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notes');
    }
  }, [page]);

  useEffect(() => {
    void load(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/notes', { method: 'POST', body: { title, content } });
      setTitle('');
      setContent('');
      await load(1);
      setPage(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create note');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/notes/${id}`, {
        method: 'PATCH',
        body: { title: editTitle, content: editContent },
      });
      setEditingId(null);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update note');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this note?')) return;
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
    <div className="stack">
      <section className="panel">
        <h1>My notes</h1>
        <p className="muted">Private notes only you can edit. Admins can view but not change them.</p>
        {error && <div className="error">{error}</div>}
        <form className="stack" onSubmit={onCreate}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </label>
          <label>
            Content
            <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={10000} />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            Add note
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>Notes</h2>
        <div className="list">
          {result?.data.map((note) => (
            <article key={note._id} className="card stack">
              {editingId === note._id ? (
                <>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <div className="row">
                    <button className="btn" type="button" disabled={busy} onClick={() => onSaveEdit(note._id)}>
                      Save
                    </button>
                    <button className="btn ghost" type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{note.title}</h3>
                  <p>{note.content || <span className="muted">(empty)</span>}</p>
                  <div className="row">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(note._id);
                        setEditTitle(note.title);
                        setEditContent(note.content);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn danger" type="button" disabled={busy} onClick={() => onDelete(note._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
          {result && result.data.length === 0 && <p className="muted">No notes yet.</p>}
        </div>
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}
