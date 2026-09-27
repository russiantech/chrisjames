import { Link } from 'react-router-dom';

import { useMarkNotifications, useNotifications } from '@/api/hooks';

function timeAgo(value: string): string {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'],
    [604800, 'day'], [2592000, 'week'], [31536000, 'month'],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  let previous = 1;
  for (const [limit, unit] of units) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / previous), unit);
    previous = limit;
  }
  return formatter.format(-Math.floor(seconds / 31536000), 'year');
}

export function Notifications() {
  const { data, isLoading } = useNotifications();
  const mark = useMarkNotifications();

  const unread = data?.items.filter((item) => item.read_at === null) ?? [];

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-6">
              <h1 className="h3 mb-0">Notifications</h1>
              {unread.length > 0 && (
                <button
                  className="btn btn-sm btn-neutral rounded-pill"
                  onClick={() => mark.mutate([])}
                  disabled={mark.isPending}
                >
                  Mark all read
                </button>
              )}
            </div>

            {isLoading && <p className="text-muted">Loading…</p>}

            {data && data.items.length === 0 && (
              <div className="text-center py-10">
                <i className="bi bi-bell-slash display-4 text-muted" />
                <p className="text-muted mt-3 mb-0">Nothing yet.</p>
              </div>
            )}

            <div className="list-group">
              {data?.items.map((notification) => {
                const body = (
                  <>
                    <div
                      className={`icon icon-shape rounded-circle bg-${notification.accent} bg-opacity-10 text-${notification.accent} flex-shrink-0`}
                    >
                      <i className={`bi ${notification.icon}`} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <p className="mb-1 text-heading fw-semibold text-sm">
                        {notification.title}
                        {notification.group_count > 1 && (
                          <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill ms-2">
                            {notification.group_count}
                          </span>
                        )}
                      </p>
                      {notification.body && (
                        <p className="mb-1 text-sm text-muted cj-line-clamp-2">{notification.body}</p>
                      )}
                      <time className="text-xs text-muted" dateTime={notification.created_at}>
                        {timeAgo(notification.created_at)}
                      </time>
                    </div>
                    {notification.read_at === null && (
                      <span className="badge bg-primary rounded-circle p-1 align-self-start" aria-label="Unread" />
                    )}
                  </>
                );

                const className = `list-group-item d-flex gap-3 align-items-start ${
                  notification.read_at === null ? 'bg-primary bg-opacity-10' : ''
                }`;

                return notification.url ? (
                  <Link
                    key={notification.id}
                    to={notification.url}
                    className={`${className} text-decoration-none`}
                    onClick={() => mark.mutate([notification.id])}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={notification.id} className={className}>
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
