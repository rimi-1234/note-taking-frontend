'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/guards';
import { Pagination } from '@/components/pagination';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ApiError, type Paginated, type Post } from '@/lib/types';

type UserPostsResponse = Paginated<Post> & {
  user: { _id: string; name: string; interests: string[] };
};

export default function UserPostsPage() {
  return (
    <RequireAuth>
      <UserPostsContent />
    </RequireAuth>
  );
}

function UserPostsContent() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { user } = useAuth();
  const isOwn = user?._id === userId;

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<UserPostsResponse | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page) {
    setError(null);
    try {
      const data = await api<UserPostsResponse>(`/users/${userId}/posts`, {
        query: { page: nextPage, limit: 5 },
      });
      setResult(data);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load posts');
    }
  }

  useEffect(() => {
    void load(page);
  }, [userId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!isOwn) return;
    setBusy(true);
    setError(null);
    try {
      await api('/posts', { method: 'POST', body: { title, body } });
      setTitle('');
      setBody('');
      setPage(1);
      await load(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create post');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/posts/${id}`, { method: 'DELETE' });
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack page-enter">
      <section className="panel">
        <div className="page-head">
          <h1>{result ? `${result.user.name}'s posts` : 'Posts'}</h1>
          {result && (
            <p className="muted">
              Interests:{' '}
              {result.user.interests.length
                ? result.user.interests.map((item) => (
                    <span key={item} className="chip" style={{ marginRight: 6 }}>
                      {item}
                    </span>
                  ))
                : 'none'}
            </p>
          )}
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {isOwn && (
        <section className="panel">
          <h2>New post</h2>
          <form className="stack" onSubmit={onCreate}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Body
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
            </label>
            <button className="btn" type="submit" disabled={busy}>
              Publish
            </button>
          </form>
        </section>
      )}

      <section className="panel stack">
        <div className="list">
          {result?.data.map((post) => (
            <article key={post._id} className="card stack">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              {isOwn && (
                <button className="btn danger" type="button" disabled={busy} onClick={() => onDelete(post._id)}>
                  Delete
                </button>
              )}
            </article>
          ))}
          {result && result.data.length === 0 && <p className="muted">No posts yet.</p>}
        </div>
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}
