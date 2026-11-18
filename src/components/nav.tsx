'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ChevronRightIcon,
  CloseIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
  NoteIcon,
  PostIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from './icons';
import { Avatar, Skel } from './ui';

type NavItem = { href: string; label: string; icon: ReactNode; match?: (path: string) => boolean };
type Crumb = { label: string; href?: string };

function Brand() {
  return (
    <Link href="/notes" className="brand">
      <span className="brand-mark" aria-hidden />
      <span className="brand-name">Secure Notes</span>
    </Link>
  );
}

function crumbsFor(pathname: string, myId: string | undefined): Crumb[] {
  const home: Crumb = { label: 'Dashboard', href: '/notes' };
  if (pathname.startsWith('/notes')) return [home, { label: 'My notes' }];
  if (pathname.startsWith('/profile')) return [home, { label: 'Account' }, { label: 'Profile' }];
  if (pathname.startsWith('/admin/users')) return [home, { label: 'Admin' }, { label: 'Users' }];
  if (pathname.startsWith('/admin/notes')) return [home, { label: 'Admin' }, { label: 'All notes' }];
  if (pathname.startsWith('/admin/interests')) return [home, { label: 'Admin' }, { label: 'Interests' }];
  if (pathname.startsWith('/users/')) {
    const own = myId && pathname === `/users/${myId}/posts`;
    return own ? [home, { label: 'My posts' }] : [home, { label: 'Users' }, { label: 'Posts' }];
  }
  return [home];
}

function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className={last ? 'current' : undefined} aria-current={last ? 'page' : undefined}>
                {i === 0 && <HomeIcon size={15} />}
                {item.href && !last ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              </li>
              {!last && (
                <li className="sep" aria-hidden>
                  <ChevronRightIcon size={14} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function FrameSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame" aria-busy="true">
      <aside className="sidebar sidebar-skeleton" aria-hidden>
        <div className="sidebar-top">
          <Brand />
        </div>
        <div className="sidebar-nav">
          <Skel w={80} h={9} className="skel-dark side-section-skel" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="side-link">
              <Skel w={20} h={20} r={6} className="skel-dark" />
              <Skel w={90 + i * 12} h={11} className="skel-dark" />
            </div>
          ))}
        </div>
        <div className="sidebar-user">
          <Skel w={40} h={40} r="50%" className="skel-dark" />
          <div className="sidebar-user-text">
            <Skel w={100} h={11} className="skel-dark" />
            <Skel w={130} h={9} className="skel-dark" />
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <Skel w={180} h={12} />
          <Skel w={36} h={36} r="50%" className="push-right" />
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (pathname === '/login') return <main className="bare-main">{children}</main>;
  if (loading) return <FrameSkeleton>{children}</FrameSkeleton>;
  if (!user) return <main className="bare-main">{children}</main>;

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const workspace: NavItem[] = [
    { href: '/notes', label: 'My notes', icon: <NoteIcon /> },
    {
      href: `/users/${user._id}/posts`,
      label: 'My posts',
      icon: <PostIcon />,
      match: (path) => path === `/users/${user._id}/posts`,
    },
    { href: '/profile', label: 'Profile', icon: <UserIcon /> },
  ];
  const admin: NavItem[] = [
    { href: '/admin/users', label: 'Users', icon: <UsersIcon /> },
    { href: '/admin/notes', label: 'All notes', icon: <LayersIcon /> },
    { href: '/admin/interests', label: 'Interests', icon: <TagIcon /> },
  ];

  const renderLinks = (items: NavItem[], offset = 0) =>
    items.map((item, i) => (
      <Link
        key={item.href}
        href={item.href}
        className={`side-link${isActive(item) ? ' active' : ''}`}
        aria-current={isActive(item) ? 'page' : undefined}
        style={{ '--i': i + offset } as React.CSSProperties}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    ));

  return (
    <div className="app-frame">
      <div
        className={`drawer-backdrop${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />

      <aside className={`sidebar${drawerOpen ? ' open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-top">
          <Brand />
          <button
            type="button"
            className="icon-btn sidebar-close"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="side-section">Workspace</span>
          {renderLinks(workspace)}
          {user.role === 'admin' && (
            <>
              <span className="side-section">Admin</span>
              {renderLinks(admin, workspace.length)}
            </>
          )}
        </nav>

        <div className="sidebar-card">
          <span className="sidebar-card-orb" aria-hidden />
          <strong>Sessions secured</strong>
          <span>Tokens rotate automatically and can be revoked anytime.</span>
        </div>

        <div className="sidebar-user">
          <Avatar name={user.name} />
          <div className="sidebar-user-text">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="icon-btn" aria-label="Log out" title="Log out" onClick={onLogout}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </button>
          <Breadcrumbs items={crumbsFor(pathname, user._id)} />
          <div className="topbar-right">
            <span className={`badge ${user.role === 'admin' ? 'badge-admin' : ''} hide-sm`}>{user.role}</span>
            <Link href="/profile" className="topbar-user" aria-label="Profile">
              <span className="topbar-user-text hide-sm">
                <strong>{user.name}</strong>
              </span>
              <Avatar name={user.name} size="sm" />
            </Link>
          </div>
        </header>
        <main className="app-content" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}
