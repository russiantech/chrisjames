import { describeError } from '@/api/client';
import { Link, useParams } from 'react-router-dom';

import { usePayment, usePublicSettings, useSimulatePayment } from '@/api/hooks';

function formatAmount(minor: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };
  return `${symbols[currency] ?? ''}${(minor / 100).toLocaleString()}`;
}

/**
 * The mock payment provider's checkout URL points here — this is the whole
 * "hosted checkout page" for a provider that has no third-party account
 * behind it. Swap PAYMENT_PROVIDER to stripe or paystack and their own
 * hosted page takes over; this route is never reached in that case.
 */
export function Checkout() {
  const { reference = '' } = useParams();
  const { data: payment, isLoading } = usePayment(reference);
  const { data: settings } = usePublicSettings();
  const simulate = useSimulatePayment();

  const isMock = settings?.payment_provider === 'mock';

  if (isLoading) {
    return <div className="container py-10 text-center text-muted">Loading…</div>;
  }

  if (!payment) {
    return (
      <div className="container py-10 text-center">
        <i className="bi bi-question-circle display-4 text-muted" />
        <h1 className="h3 mt-4">No payment with that reference</h1>
        <Link className="btn btn-neutral rounded-pill mt-3" to="/">
          Go home
        </Link>
      </div>
    );
  }

  const settled = payment.status === 'succeeded';
  const failed = payment.status === 'failed';

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-5">
            <div className="card border shadow-none">
              <div className="card-body text-center py-6">
                {settled ? (
                  <>
                    <i className="bi bi-check-circle display-4 text-success" />
                    <h1 className="h4 mt-4 mb-2">Payment received</h1>
                    <p className="text-muted mb-1">
                      {formatAmount(payment.amount_minor, payment.currency)} — {payment.description}
                    </p>
                    {payment.subject_type === 'advert' && (
                      <p className="text-sm text-muted mb-4">
                        Your advert is now live in the slot you booked.
                      </p>
                    )}
                    <Link className="btn btn-primary rounded-pill px-5 mt-3" to="/dashboard">
                      Back to dashboard
                    </Link>
                  </>
                ) : failed ? (
                  <>
                    <i className="bi bi-x-circle display-4 text-danger" />
                    <h1 className="h4 mt-4 mb-2">Payment failed</h1>
                    <p className="text-muted mb-4">Nothing was charged. You can try again.</p>
                    <Link className="btn btn-neutral rounded-pill px-5" to="/advertise">
                      Back to advertising
                    </Link>
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card display-4 text-primary" />
                    <h1 className="h4 mt-4 mb-2">
                      {formatAmount(payment.amount_minor, payment.currency)}
                    </h1>
                    <p className="text-muted mb-1">{payment.description}</p>
                    <p className="text-xs text-muted mb-5">Reference: {payment.reference}</p>

                    {isMock ? (
                      <>
                        <p className="text-xs text-muted mb-3">
                          Test mode — no card is charged. This stands in for a real provider's
                          hosted checkout page.
                        </p>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-primary rounded-pill px-5"
                            disabled={simulate.isPending}
                            onClick={() => simulate.mutate({ reference, succeed: true })}
                          >
                            {simulate.isPending ? 'Processing…' : 'Pay now (test)'}
                          </button>
                          <button
                            className="btn btn-neutral rounded-pill px-4"
                            disabled={simulate.isPending}
                            onClick={() => simulate.mutate({ reference, succeed: false })}
                          >
                            Simulate failure
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">
                        This payment is being handled by {payment.provider}. If you were not
                        redirected automatically, check your browser's pop-up blocker.
                      </p>
                    )}

                    {simulate.isError && (
                      <p className="text-sm text-danger mt-4 mb-0">
                        {describeError(simulate.error)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
