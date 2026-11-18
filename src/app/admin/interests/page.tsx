'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAdmin } from '@/components/guards';
import { ActivityIcon, SearchIcon, TagIcon, UsersIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import {
  Alert,
  Avatar,
  EmptyState,
  InterestCardSkeleton,
  PageHeader,
  StatCard,
  StatsSkeleton,
  stagger,
} from '@/components/ui';
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
          query: { page, limit: 6, interest: filter || undefined },
        });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load interests');
      }
    })();
  }, [page, filter]);

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Admin"
        title="Interests"
        description="Users grouped by what they're into."
      />

      {result ? (
        <div className="stats-grid">
          <StatCard index={0} icon={<TagIcon />} label="Interest groups" value={result.total} hint={filter ? `Matching "${filter}"` : 'All interests'} />
          <StatCard
            index={1}
            tone="violet"
            icon={<UsersIcon />}
            label="People listed"
            value={result.data.reduce((sum, g) => sum + g.count, 0)}
            hint="Across groups on this page"
          />
          <StatCard
            index={2}
            tone="amber"
            icon={<ActivityIcon />}
            label="Most popular"
            value={result.data.length ? [...result.data].sort((a, b) => b.count - a.count)[0]!.interest : '—'}
            hint={result.data.length ? 'On this page' : 'No data yet'}
          />
        </div>
      ) : (
        <StatsSkeleton />
      )}

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setFilter(interest.trim().toLowerCase());
        }}
      >
        <div className="input-icon">
          <SearchIcon size={18} />
          <input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="Search an interest, e.g. chess"
            aria-label="Filter by interest"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
        {filter && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setInterest('');
              setFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <Alert>{error}</Alert>}

      <div className="grid-cards grid-cards-3">
        {!result && Array.from({ length: 6 }, (_, i) => <InterestCardSkeleton key={i} />)}
        {result?.data.map((group, i) => (
          <article key={group.interest} className="card interest-card" style={stagger(i)}>
            <div className="interest-head">
              <span className="interest-icon">
                <TagIcon size={18} />
              </span>
              <h3>{group.interest}</h3>
              <span className="count-badge">{group.count}</span>
            </div>
            <ul className="interest-users">
              {group.users.map((u) => (
                <li key={u._id}>
                  <Link href={`/users/${u._id}/posts`}>
                    <Avatar name={u.name} size="sm" />
                    <span className="user-cell-text">
                      <strong>{u.name}</strong>
                      <span>{u.email}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {result && result.data.length === 0 && (
        <EmptyState icon={<TagIcon size={28} />} title="No interest groups">
          {filter ? `Nobody lists "${filter}" yet.` : 'Users have not added any interests yet.'}
        </EmptyState>
      )}
      {result && (
        <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} />
      )}
    </div>
  );
}
