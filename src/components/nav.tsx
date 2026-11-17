'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Nav() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading || !user || pathname === '/login') return null;

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? 'active' : undefined}>
      {label}
    </Link>
  );

  return (
    <header className="topbar">
      <div className="brand">
        <Link href="/notes">Secure Notes</Link>
      </div>
      <nav className="nav-links">
        {link('/notes', 'Notes')}
        {link('/profile', 'Profile')}
        {link(`/users/${user._id}/posts`, 'My posts')}
        {user.role === 'admin' && (
          <>
            {link('/admin/users', 'Users')}
            {link('/admin/notes', 'All notes')}
            {link('/admin/interests', 'Interests')}
          </>
        )}
      </nav>
      <div className="nav-meta">
        <span className="muted">
          {user.name} · {user.role}
        </span>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
