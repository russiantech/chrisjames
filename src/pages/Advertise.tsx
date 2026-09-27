import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { describeError } from '@/api/client';
import {
  useAdSlot,
  useAdSlotList,
  useBookAdvert,
  useCreateCheckout,
} from '@/api/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { useContactModal } from '@/features/contact/ContactModalContext';

function formatPrice(minor: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };
  return `${symbols[currency] ?? ''}${(minor / 100).toLocaleString()}`;
}

const PRICING_LABEL: Record<string, string> = {
  cpm: 'per 1,000 views',
  cpc: 'per click',
  flat_weekly: 'per week',
  flat_monthly: 'per month',
};

export function Advertise() {
  const { user, can } = useAuth();
  const { data: slots, isLoading } = useAdSlotList();
  const { open: openContact } = useContactModal();

  const canBook = can('ad:purchase', 'ad:manage');

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <header className="text-center mb-8">
              <h1 className="ls-tight font-bolder display-6 mb-3">Advertise here</h1>
              <p className="lead text-muted mb-0">
                Book a placement and pay online — it goes live automatically the moment
                payment is verified. No trackers, no third-party scripts; adverts are
                served from this site's own database.
              </p>
            </header>

            {isLoading && <p className="text-center text-muted">Loading placements…</p>}

            {!isLoading && !canBook && (
              <div className="card border shadow-none bg-surface-secondary mb-8">
                <div className="card-body text-center py-6">
                  <h2 className="h5 mb-2">
                    {user ? 'Your account cannot book ads yet' : 'Want to run an advert?'}
                  </h2>
                  <p className="text-muted mb-4">
                    {user
                      ? 'Advertiser access is needed to self-serve a booking — get in touch and it can be arranged.'
                      : 'Tell me what you are advertising and which placement you want.'}
                  </p>
                  <button
                    className="btn btn-primary rounded-pill px-5"
                    onClick={() => openContact('message')}
                  >
                    Get in touch
                  </button>
                </div>
              </div>
            )}

            {canBook && slots && slots.length > 0 && <BookingForm slots={slots} />}

            <div className="mt-8">
              <p className="text-sm text-muted mb-2">Live preview of the sidebar slot:</p>
              <SidebarPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingForm({
  slots,
}: {
  slots: { id: number; key: string; name: string; pricing_model: string; base_price_minor: number; currency: string }[];
}) {
  const navigate = useNavigate();
  const bookAdvert = useBookAdvert();
  const createCheckout = useCreateCheckout();

  const [slotId, setSlotId] = useState(slots[0]?.id ?? 0);
  const [form, setForm] = useState({
    name: '', headline: '', body: '', cta_label: 'Learn more', target_url: '',
  });
  const [budget, setBudget] = useState(String((slots[0]?.base_price_minor ?? 5000) / 100));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? slots[0];

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // The advert is created unpublished (pending_payment) — it only starts
      // serving once the payment below settles.
      const advert = await bookAdvert.mutateAsync({ slot_id: slotId, ...form });
      const checkout = await createCheckout.mutateAsync({
        amount_minor: Math.round(Number(budget) * 100),
        currency: selectedSlot?.currency ?? 'USD',
        purpose: 'advert',
        description: `Advert: ${form.name}`,
        subject_type: 'advert',
        subject_id: advert.id,
      });
      // The mock provider's checkout_url already points at our own
      // /checkout/:reference route; a real provider would send the browser
      // to its own hosted page instead.
      if (checkout.checkout_url.startsWith(window.location.origin)) {
        navigate(checkout.checkout_url.replace(window.location.origin, ''));
      } else {
        window.location.href = checkout.checkout_url;
      }
    } catch (caught) {
      setError(describeError(caught));
      setBusy(false);
    }
  }

  return (
    <form className="card border shadow-none mb-8" onSubmit={handleSubmit}>
      <div className="card-body">
        <h2 className="h5 mb-4">Book a placement</h2>

        <div className="row g-4 mb-2">
          <div className="col-12">
            <label className="form-label" htmlFor="slot">Placement</label>
            <select
              id="slot"
              className="form-select"
              value={slotId}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSlotId(next);
                const slot = slots.find((s) => s.id === next);
                if (slot) setBudget(String(slot.base_price_minor / 100));
              }}
            >
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} — {formatPrice(slot.base_price_minor, slot.currency)}{' '}
                  {PRICING_LABEL[slot.pricing_model] ?? ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="ad-name">Campaign name</label>
            <input id="ad-name" className="form-control" value={form.name}
              onChange={(event) => update('name', event.target.value)} required minLength={2} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="ad-headline">Headline</label>
            <input id="ad-headline" className="form-control" value={form.headline}
              onChange={(event) => update('headline', event.target.value)} required />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="ad-body">Copy</label>
            <textarea id="ad-body" className="form-control" rows={2} value={form.body}
              onChange={(event) => update('body', event.target.value)} maxLength={500} />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="ad-cta">Button label</label>
            <input id="ad-cta" className="form-control" value={form.cta_label}
              onChange={(event) => update('cta_label', event.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="ad-url">Where it links</label>
            <input id="ad-url" type="url" className="form-control" value={form.target_url}
              onChange={(event) => update('target_url', event.target.value)} required
              placeholder="https://…" />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="ad-budget">
              Budget ({selectedSlot?.currency ?? 'USD'})
            </label>
            <input id="ad-budget" type="number" min={1} step="0.01" className="form-control"
              value={budget} onChange={(event) => setBudget(event.target.value)} required />
            <div className="form-text">
              Suggested: {selectedSlot && formatPrice(selectedSlot.base_price_minor, selectedSlot.currency)}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger mt-4 mb-0">{error}</div>}

        <button type="submit" className="btn btn-primary rounded-pill px-5 mt-4" disabled={busy}>
          {busy ? 'Setting up…' : 'Continue to payment'}
        </button>
        <p className="text-xs text-muted mt-3 mb-0">
          Your advert stays unpublished until payment is confirmed, then it goes live automatically.
        </p>
      </div>
    </form>
  );
}

function SidebarPreview() {
  const { data } = useAdSlot('sidebar_primary');
  if (!data) return null;
  return (
    <div className="border rounded-3 p-4" style={{ maxWidth: 320 }}>
      {data.creatives.length > 0 ? (
        <p className="text-sm text-muted mb-0">
          Currently running: {data.creatives.map((creative) => creative.headline).join(', ')}
        </p>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: data.fallback_html ?? '' }} />
      )}
    </div>
  );
}
