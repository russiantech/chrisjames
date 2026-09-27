import { NavLink, Outlet } from 'react-router-dom';

import { useNotificationCounts, useOverview } from '@/api/hooks';
import { useAuth } from '@/features/auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Any one of these is enough to see the link. */
  permissions?: string[];
  badge?: number;
}

export function DashboardLayout() {
  const { user, can } = useAuth();
  const { data: overview } = useOverview();
  const { data: counts } = useNotificationCounts();

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: 'bi-speedometer2', permissions: ['analytics:read'] },
    {
      to: '/dashboard/review',
      label: 'Review queue',
      icon: 'bi-inbox',
      permissions: ['post:moderate'],
      badge: overview?.counters.awaiting_review,
    },
    {
      to: '/dashboard/comments',
      label: 'Comments',
      icon: 'bi-chat-left-text',
      permissions: ['comment:moderate'],
      badge: overview?.counters.comments_pending,
    },
    {
      to: '/dashboard/inbox',
      label: 'Inbox',
      icon: 'bi-envelope',
      permissions: ['inbox:read'],
      badge: overview?.counters.unread_messages,
    },
    { to: '/dashboard/settings', label: 'Settings', icon: 'bi-sliders', permissions: ['settings:manage'] },
    { to: '/dashboard/roles', label: 'Roles', icon: 'bi-shield-check', permissions: ['role:manage'] },
    { to: '/dashboard/projects', label: 'Projects', icon: 'bi-kanban', permissions: ['portfolio:manage'] },
    { to: '/dashboard/adverts', label: 'Adverts', icon: 'bi-badge-ad', permissions: ['ad:manage'] },
    { to: '/dashboard/users', label: 'Users', icon: 'bi-people', permissions: ['user:manage'] },
  ];

  const visible = items.filter((item) => !item.permissions || can(...item.permissions));

  return (
    <div className="py-8">
      <div className="container-fluid px-lg-6">
        <div className="row g-6">
          <aside className="col-lg-3 col-xl-2">
            <div className="position-sticky" style={{ top: '6rem' }}>
              <div className="d-flex align-items-center gap-3 mb-5 px-2">
                <div className="avatar rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                  {(user?.display_name ?? user?.username ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="d-block fw-semibold text-sm text-truncate">
                    {user?.display_name ?? user?.username}
                  </span>
                  <span className="d-block text-xs text-muted text-truncate">
                    {user?.roles?.map((role) => role.label).join(', ')}
                  </span>
                </div>
              </div>

              <nav className="nav flex-column gap-1">
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center gap-2 rounded-2 px-3 py-2 ${
                        isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-heading'
                      }`
                    }
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="badge bg-danger rounded-pill ms-auto">{item.badge}</span>
                    )}
                  </NavLink>
                ))}

                <hr className="my-3" />

                <NavLink
                  to="/notifications"
                  className="nav-link d-flex align-items-center gap-2 rounded-2 px-3 py-2 text-heading"
                >
                  <i className="bi bi-bell" />
                  <span>Notifications</span>
                  {(counts?.unread ?? 0) > 0 && (
                    <span className="badge bg-danger rounded-pill ms-auto">{counts?.unread}</span>
                  )}
                </NavLink>
                <NavLink
                  to="/write"
                  className="nav-link d-flex align-items-center gap-2 rounded-2 px-3 py-2 text-heading"
                >
                  <i className="bi bi-pencil-square" />
                  <span>Write a post</span>
                </NavLink>
              </nav>
            </div>
          </aside>

          <div className="col-lg-9 col-xl-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
