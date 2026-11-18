'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/guards';
import { PlusIcon, PostIcon, TrashIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { Alert, Avatar, EmptyState, HeroSkeleton, PostCardSkeleton, stagger } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { relativeTime } from '@/lib/format';
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

  const load = useCallback(
    async (nextPage: number) => {
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
    },
    [userId],
  );

  useEffect(() => {
    void load(page);
  }, [page, load]);

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

  const authorName = result?.user.name;

  return (
    <div className="page page-enter">
      {result ? (
        <section className="card author-hero">
          <Avatar name={authorName} size="lg" />
          <div className="profile-hero-text">
            <span className="eyebrow">{isOwn ? 'Your posts' : 'Posts by'}</span>
            <h1>{authorName}</h1>
            <div className="chips">
              {result.user.interests.length ? (
                result.user.interests.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))
              ) : (
                <span className="meta">No interests listed</span>
              )}
            </div>
          </div>
          <span className="stat-pill">
            <PostIcon size={16} /> {result.total} {result.total === 1 ? 'post' : 'posts'}
          </span>
        </section>
      ) : (
        <HeroSkeleton />
      )}

      {error && <Alert>{error}</Alert>}

      <div className={isOwn ? 'split' : undefined}>
        {isOwn && (
          <form className="card composer" onSubmit={onCreate}>
            <div className="card-title">
              <span className="card-title-icon">
                <PlusIcon size={18} />
              </span>
              <h2>New post</h2>
            </div>
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" required />
            </label>
            <label className="field">
              <span>Body</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share the details…"
                rows={6}
                required
              />
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={busy || !title.trim() || !body.trim()}>
                Publish
              </button>
            </div>
          </form>
        )}

        <section className="stack" aria-label="Posts">
          <div className="feed">
            {!result && Array.from({ length: 3 }, (_, i) => <PostCardSkeleton key={i} />)}
            {result?.data.map((post, i) => (
              <article key={post._id} className="card post-card" style={stagger(i)}>
                <div className="post-card-head">
                  <Avatar name={authorName} size="sm" />
                  <div>
                    <strong>{authorName}</strong>
                    <span className="meta">{relativeTime(post.createdAt)}</span>
                  </div>
                  {isOwn && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger post-delete"
                      aria-label="Delete post"
                      disabled={busy}
                      onClick={() => onDelete(post._id)}
                    >
                      <TrashIcon size={18} />
                    </button>
                  )}
                </div>
                <h3>{post.title}</h3>
                <p className="note-body">{post.body}</p>
              </article>
            ))}
          </div>
          {result && result.data.length === 0 && (
            <EmptyState icon={<PostIcon size={28} />} title="No posts yet">
              {isOwn ? 'Publish your first post using the form.' : 'This user has not published anything yet.'}
            </EmptyState>
          )}
          {result && (
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} />
          )}
        </section>
      </div>
    </div>
  );
}
