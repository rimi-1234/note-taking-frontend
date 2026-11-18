'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { initials } from '@/lib/format';
import { CloseIcon, EyeIcon, EyeOffIcon } from './icons';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

const avatarHues = [222, 262, 190, 330, 160, 28, 290, 205];

export function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const hue = avatarHues[(name ?? '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarHues.length];
  return (
    <span className={`avatar avatar-${size}`} style={{ '--hue': hue } as CSSProperties} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Index-based delay so lists animate in one after another. */
export function stagger(index: number): CSSProperties {
  return { '--i': Math.min(index, 12) } as CSSProperties;
}

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(initial + (value - initial) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'indigo',
  index = 0,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'indigo' | 'violet' | 'teal' | 'amber';
  index?: number;
}) {
  return (
    <div className={`stat-card tone-${tone}`} style={stagger(index)}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-text">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{typeof value === 'number' ? <CountUp value={value} /> : value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
      <span className="stat-glow" aria-hidden />
    </div>
  );
}

/* —— Skeletons: each mirrors the real component's box so loading never shifts layout —— */

export function Skel({
  w = '100%',
  h = 12,
  r = 6,
  className = '',
}: {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  className?: string;
}) {
  return <span className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden />;
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card is-skeleton" aria-hidden>
      <Skel w={44} h={44} r={12} />
      <div className="stat-text">
        <Skel w={80} h={10} />
        <Skel w={56} h={24} r={8} />
        <Skel w={110} h={10} />
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function NoteCardSkeleton({ withOwner = false }: { withOwner?: boolean }) {
  return (
    <div className="card note-card is-skeleton" aria-hidden>
      <div className="note-card-head">
        <Skel w="55%" h={16} />
        {!withOwner && <Skel w={56} h={24} r={8} />}
      </div>
      <div className="note-body skel-lines">
        <Skel w="95%" />
        <Skel w="88%" />
        <Skel w="70%" />
      </div>
      {withOwner ? (
        <div className="owner-line">
          <Skel w={32} h={32} r="50%" />
          <span className="skel-lines">
            <Skel w={90} h={10} />
            <Skel w={60} h={9} />
          </span>
        </div>
      ) : (
        <Skel w={90} h={10} />
      )}
    </div>
  );
}

export function UserRowSkeleton() {
  return (
    <div className="user-row is-skeleton" aria-hidden>
      <div className="user-cell">
        <Skel w={40} h={40} r="50%" />
        <div className="user-cell-text skel-lines">
          <Skel w={120} h={12} />
          <Skel w={160} h={10} />
        </div>
      </div>
      <div>
        <Skel w={56} h={20} r={999} />
      </div>
      <div className="chips">
        <Skel w={54} h={20} r={999} />
        <Skel w={64} h={20} r={999} />
      </div>
      <div className="row-actions">
        <Skel w={36} h={36} r={9} />
        <Skel w={36} h={36} r={9} />
        <Skel w={36} h={36} r={9} />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card post-card is-skeleton" aria-hidden>
      <div className="post-card-head">
        <Skel w={32} h={32} r="50%" />
        <div className="skel-lines">
          <Skel w={110} h={11} />
          <Skel w={60} h={9} />
        </div>
      </div>
      <Skel w="50%" h={16} />
      <div className="skel-lines">
        <Skel w="96%" />
        <Skel w="80%" />
      </div>
    </div>
  );
}

export function InterestCardSkeleton() {
  return (
    <div className="card interest-card is-skeleton" aria-hidden>
      <div className="interest-head">
        <Skel w={34} h={34} r={10} />
        <Skel w="45%" h={15} />
        <Skel w={30} h={20} r={999} className="push-right" />
      </div>
      <div className="interest-users">
        {[0, 1, 2].map((i) => (
          <div key={i} className="interest-user-skel">
            <Skel w={32} h={32} r="50%" />
            <span className="skel-lines">
              <Skel w={100} h={11} />
              <Skel w={140} h={9} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="card author-hero is-skeleton" aria-hidden>
      <Skel w={72} h={72} r="50%" />
      <div className="profile-hero-text">
        <Skel w={70} h={10} />
        <Skel w={200} h={24} r={8} />
        <div className="chips">
          <Skel w={56} h={20} r={999} />
          <Skel w={70} h={20} r={999} />
        </div>
      </div>
    </section>
  );
}

/** Shown while the session is restored: generic dashboard page shape. */
export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading">
      <div className="page-header">
        <div className="page-header-text skel-lines">
          <Skel w={70} h={10} />
          <Skel w={220} h={30} r={8} />
          <Skel w={340} h={12} className="hide-sm" />
        </div>
      </div>
      <StatsSkeleton />
      <div className="grid-cards">
        {Array.from({ length: 6 }, (_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
  required,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
