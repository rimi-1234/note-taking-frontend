'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAdmin } from '@/components/guards';
import { Pagination } from '@/components/pagination';
import { api } from '@/lib/api';
import { ApiError, type Paginated } from '@/lib/types';

type InterestGroup = {
  interest: string;
  count: number;
  users: Array<{ _id: string; name: string; email: string }>;
};

export default function AdminInterestsPage() {
  return (
    <RequireAdmin>
      <AdminInterestsContent />
    </RequireAdmin>
  );
}

function AdminInterestsContent() {
  const [page, setPage] = useState(1);
  const [interest, setInterest] = useState('');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState<Paginated<InterestGroup> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const data = await api<Paginated<InterestGroup>>('/users/by-interest', {
          query: { page, limit: 5, interest: filter || undefined },
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load interests');
      }
    })();
  }, [page, filter]);

  return (
    <div className="stack page-enter">
      <section className="panel stack">
        <div className="page-head">
          <h1>Admin · Interests</h1>
          <p className="muted">Grouped from one aggregation on the interests index.</p>
        </div>
        {error && <div className="error">{error}</div>}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setFilter(interest.trim().toLowerCase());
          }}
        >
          <label style={{ flex: 1 }}>
            Filter interest
            <input
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g. chess"
            />
          </label>
          <button className="btn" type="submit">
            Apply
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setInterest('');
              setFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="panel stack">
        <div className="list">
          {result?.data.map((group) => (
            <article key={group.interest} className="card stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>
                  <span className="chip">{group.interest}</span>
                </h3>
                <span className="muted">{group.count} user(s)</span>
              </div>
              <ul>
                {group.users.map((u) => (
                  <li key={u._id}>
                    <Link href={`/users/${u._id}/posts`}>
                      {u.name} ({u.email})
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {result && result.data.length === 0 && <p className="muted">No interest groups.</p>}
        </div>
        {result && (
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}
