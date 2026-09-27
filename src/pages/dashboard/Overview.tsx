import { useOverview } from '@/api/hooks';

const CARDS: { key: string; label: string; icon: string; accent: string }[] = [
  { key: 'published_posts', label: 'Published posts', icon: 'bi-journal-text', accent: 'primary' },
  { key: 'awaiting_review', label: 'Awaiting review', icon: 'bi-inbox', accent: 'warning' },
  { key: 'comments_pending', label: 'Comments to moderate', icon: 'bi-chat-left-dots', accent: 'info' },
  { key: 'unread_messages', label: 'Unread messages', icon: 'bi-envelope', accent: 'danger' },
  { key: 'open_requests', label: 'Open project briefs', icon: 'bi-briefcase', accent: 'success' },
  { key: 'subscribers', label: 'Subscribers', icon: 'bi-people', accent: 'primary' },
];

export function Overview() {
  const { data, isLoading } = useOverview();

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!data) return null;

  const peak = Math.max(1, ...data.views_30d.map((point) => point.value));

  return (
    <>
      <h1 className="h3 mb-5">Overview</h1>

      <div className="row g-4 mb-6">
        {CARDS.map((card) => (
          <div className="col-6 col-lg-4 col-xl-2" key={card.key}>
            <div className="card border shadow-none h-100">
              <div className="card-body">
                <div
                  className={`icon icon-shape rounded-3 bg-${card.accent} bg-opacity-10 text-${card.accent} mb-3`}
                >
                  <i className={`bi ${card.icon}`} />
                </div>
                <span className="d-block h3 mb-0">{data.counters[card.key] ?? 0}</span>
                <span className="d-block text-xs text-muted">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-5">
        <div className="col-lg-8">
          <div className="card border shadow-none h-100">
            <div className="card-body">
              <h2 className="h6 mb-4">Reads, last 30 days</h2>
              {data.views_30d.length === 0 ? (
                <p className="text-sm text-muted mb-0">No reads recorded yet.</p>
              ) : (
                <div
                  className="d-flex align-items-end gap-1"
                  style={{ height: 160 }}
                  role="img"
                  aria-label="Daily reads over the last thirty days"
                >
                  {data.views_30d.map((point) => (
                    <div
                      key={point.date}
                      className="flex-grow-1 bg-primary rounded-top"
                      style={{
                        height: `${Math.max(4, (point.value / peak) * 100)}%`,
                        opacity: 0.35 + (point.value / peak) * 0.65,
                      }}
                      title={`${point.date}: ${point.value}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border shadow-none h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Revenue, last 30 days</h2>
              <p className="display-6 font-bolder mb-1">
                {(data.revenue_30d_minor / 100).toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm text-muted mb-0">Settled payments only.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
