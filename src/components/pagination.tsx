'use client';

import { ChevronLeftIcon, ChevronRightIcon } from './icons';

type Props = {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeftIcon size={16} />
        <span>Previous</span>
      </button>
      <span className="pagination-info">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        {typeof total === 'number' && <span className="pagination-total"> · {total} total</span>}
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <span>Next</span>
        <ChevronRightIcon size={16} />
      </button>
    </nav>
  );
}
