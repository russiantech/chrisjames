import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getAccessToken } from '@/api/client';
import { keys } from '@/api/hooks';

/**
 * Subscribes to the server-sent event stream and invalidates the notification
 * queries whenever something arrives, so the badge updates without polling.
 *
 * EventSource cannot send an Authorization header, so the token rides as a
 * query parameter — the API accepts either.
 */
export function NotificationBell({ unread }: { unread: number }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let source: EventSource | null = null;
    let retry: number | undefined;
    let closed = false;

    function connect() {
      source = new EventSource(
        `/api/v1/notifications/stream?token=${encodeURIComponent(token as string)}`,
      );

      source.addEventListener('notification', () => {
        queryClient.invalidateQueries({ queryKey: keys.notificationCounts });
        queryClient.invalidateQueries({ queryKey: keys.notifications });
      });

      source.onerror = () => {
        source?.close();
        // Back off and reconnect; proxies drop idle streams routinely.
        if (!closed) retry = window.setTimeout(connect, 5000);
      };
    }

    connect();
    return () => {
      closed = true;
      if (retry) window.clearTimeout(retry);
      source?.close();
    };
  }, [queryClient]);

  return (
    <Link
      to="/notifications"
      className="btn btn-sm btn-neutral rounded-pill position-relative"
      aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
    >
      <i className="bi bi-bell" />
      {unread > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {unread > 99 ? '99+' : unread}
          <span className="cj-sr-only">unread notifications</span>
        </span>
      )}
    </Link>
  );
}
