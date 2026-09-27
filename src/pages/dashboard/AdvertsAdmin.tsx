import { useState } from 'react';

import {
  useAdminAdSlots,
  useAdminAdverts,
  useReviewAdvert,
  useUpdateAdSlot,
  useUpdateAdvert,
  type AdSlotOption,
} from '@/api/hooks';

function formatAmount(minor: number): string {
  return `$${(minor / 100).toLocaleString()}`;
}

const STATUS_ACCENT: Record<string, string> = {
  pending_payment: 'secondary',
  pending_review: 'warning',
  scheduled: 'info',
  running: 'success',
  paused: 'secondary',
  rejected: 'danger',
  completed: 'secondary',
};

export function AdvertsAdmin() {
  const [tab, setTab] = useState<'adverts' | 'slots'>('adverts');

  return (
    <>
      <h1 className="h3 mb-2">Adverts</h1>
      <p className="text-muted mb-5">
        Bookings started by advertisers land here for review, or auto-activate once payment
        settles. Slots below control what's for sale and where.
      </p>

      <ul className="nav nav-tabs mb-5">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'adverts' ? 'active' : ''}`} onClick={() => setTab('adverts')}>
            Bookings
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'slots' ? 'active' : ''}`} onClick={() => setTab('slots')}>
            Slots
          </button>
        </li>
      </ul>

      {tab === 'adverts' ? <AdvertList /> : <SlotList />}
    </>
  );
}

function AdvertList() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useAdminAdverts(statusFilter || undefined);
  const review = useReviewAdvert();
  const update = useUpdateAdvert();
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  return (
    <>
      <select
        className="form-select w-auto mb-4"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="pending_payment">Pending payment</option>
        <option value="pending_review">Pending review</option>
        <option value="running">Running</option>
        <option value="paused">Paused</option>
        <option value="rejected">Rejected</option>
        <option value="completed">Completed</option>
      </select>

      {isLoading && <p className="text-muted">Loading…</p>}
      {data && data.items.length === 0 && <p className="text-muted">No bookings here.</p>}

      <div className="d-flex flex-column gap-3">
        {data?.items.map((advert) => (
          <div className="card border shadow-none" key={advert.id}>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                <div>
                  <h2 className="h6 mb-1">{advert.name}</h2>
                  <p className="text-sm text-muted mb-0">{advert.headline}</p>
                </div>
                <span
                  className={`badge rounded-pill text-capitalize align-self-start bg-${STATUS_ACCENT[advert.status] ?? 'secondary'} bg-opacity-10 text-${STATUS_ACCENT[advert.status] ?? 'secondary'}`}
                >
                  {advert.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-muted mb-3">
                {advert.body}
                <br />
                <a href={advert.target_url} target="_blank" rel="noreferrer" className="text-xs">
                  {advert.target_url}
                </a>
              </p>

              <div className="d-flex flex-wrap gap-4 text-sm text-muted mb-3">
                <span>{advert.impression_count} impressions</span>
                <span>{advert.click_count} clicks</span>
                <span>{formatAmount(advert.spend_minor)} spent</span>
              </div>

              {rejecting === advert.id ? (
                <div>
                  <textarea
                    className="form-control mb-2"
                    rows={2}
                    placeholder="Why is this rejected? The advertiser sees this."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-danger rounded-pill"
                      onClick={() => {
                        review.mutate({ id: advert.id, approve: false, reason });
                        setRejecting(null);
                        setReason('');
                      }}
                    >
                      Send rejection
                    </button>
                    <button className="btn btn-sm btn-link text-muted" onClick={() => setRejecting(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {advert.status === 'pending_review' && (
                    <>
                      <button
                        className="btn btn-sm btn-primary rounded-pill"
                        onClick={() => review.mutate({ id: advert.id, approve: true })}
                        disabled={review.isPending}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-neutral rounded-pill text-danger"
                        onClick={() => setRejecting(advert.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {advert.status === 'running' && (
                    <button
                      className="btn btn-sm btn-neutral rounded-pill"
                      onClick={() => update.mutate({ id: advert.id, status: 'paused' })}
                      disabled={update.isPending}
                    >
                      Pause
                    </button>
                  )}
                  {advert.status === 'paused' && (
                    <button
                      className="btn btn-sm btn-primary rounded-pill"
                      onClick={() => update.mutate({ id: advert.id, status: 'running' })}
                      disabled={update.isPending}
                    >
                      Resume
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SlotList() {
  const { data, isLoading } = useAdminAdSlots();
  const update = useUpdateAdSlot();

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th>Slot</th>
            <th>Placement</th>
            <th>Pricing</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((slot: AdSlotOption) => (
            <tr key={slot.id}>
              <td>
                <span className="fw-semibold d-block">{slot.name}</span>
                <code className="text-xs text-muted">{slot.key}</code>
              </td>
              <td className="text-capitalize">{slot.placement}</td>
              <td>
                {formatAmount(slot.base_price_minor)} · {slot.pricing_model.replace('_', ' ')}
              </td>
              <td>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={slot.is_active}
                    onChange={(event) =>
                      update.mutate({ id: slot.id, is_active: event.target.checked })
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
