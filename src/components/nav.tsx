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

  const link = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link href={href} className={active ? 'active' : undefined}>
        {label}
      </Link>
    );
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        <Link href="/notes">Secure Notes</Link>
      </div>
      <nav className="nav-links" aria-label="Main">
        {link('/notes', 'Notes')}
        {link('/profile', 'Profile')}
        <Link
          href={`/users/${user._id}/posts`}
          className={pathname.startsWith('/users/') ? 'active' : undefined}
        >
          My posts
        </Link>
        {user.role === 'admin' && (
          <>
            {link('/admin/users', 'Users')}
            {link('/admin/notes', 'All notes')}
            {link('/admin/interests', 'Interests')}
          </>
        )}
      </nav>
      <div className="nav-meta">
        <div className="nav-user">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
