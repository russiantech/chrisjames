import { usePlans, useServices } from '@/api/hooks';
import { useContactModal } from '@/features/contact/ContactModalContext';

function formatPrice(minor: number, currency: string): string {
  if (minor === 0) return 'Free';
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };
  return `${symbols[currency] ?? ''}${(minor / 100).toLocaleString()}`;
}

export function Services() {
  const { data: services } = useServices();
  const { data: plans } = usePlans();
  const { open: openContact } = useContactModal();

  return (
    <div className="cj-section">
      <div className="container">
        <header className="text-center mb-10">
          <h1 className="ls-tight font-bolder display-6 mb-3">How we could work together</h1>
          <p className="lead text-muted mb-0 mx-auto" style={{ maxWidth: 620 }}>
            Four kinds of work, three ways to buy it. If none of them fit, say so and
            we will work something out.
          </p>
        </header>

        <div className="row g-5 mb-10">
          {services?.map((service) => (
            <div className="col-md-6" key={service.id}>
              <div className="card border shadow-none h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div
                      className={`icon icon-shape rounded-3 bg-${service.accent} bg-opacity-10 text-${service.accent} flex-shrink-0`}
                    >
                      <i className={`bi ${service.icon} fs-4`} />
                    </div>
                    <div>
                      <h2 className="h5 mb-1">{service.title}</h2>
                      <p className="text-sm text-muted mb-0">{service.summary}</p>
                    </div>
                  </div>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                    {service.bullets.map((bullet) => (
                      <li key={bullet} className="d-flex gap-2 text-sm">
                        <i className={`bi bi-check-circle-fill text-${service.accent} mt-1`} />
                        <span className="text-muted">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {service.starting_price_minor !== null && (
                    <p className="text-sm text-muted mb-0">
                      From{' '}
                      <strong className="text-heading">
                        {formatPrice(service.starting_price_minor, service.currency)}
                      </strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="h3 text-center mb-6">Engagements</h2>
          <div className="row g-5 justify-content-center">
            {plans?.map((plan) => (
              <div className="col-md-6 col-lg-4" key={plan.id}>
                <div
                  className={`card h-100 ${plan.is_highlighted ? 'border-primary border-2 shadow-3' : 'border shadow-none'}`}
                >
                  <div className="card-body">
                    {plan.badge && (
                      <span className="badge bg-primary rounded-pill mb-3">{plan.badge}</span>
                    )}
                    <h3 className="h5 mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted mb-4">{plan.description}</p>
                    <p className="h2 mb-4">
                      {formatPrice(plan.amount_minor, plan.currency)}
                      {plan.interval === 'monthly' && (
                        <span className="text-sm text-muted fw-normal"> / month</span>
                      )}
                    </p>
                    <ul className="list-unstyled d-flex flex-column gap-2 mb-5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="d-flex gap-2 text-sm">
                          <i className="bi bi-check-lg text-success mt-1" />
                          <span className="text-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`btn w-100 rounded-pill ${plan.is_highlighted ? 'btn-primary' : 'btn-neutral'}`}
                      onClick={() => openContact('brief')}
                    >
                      {plan.amount_minor === 0 ? 'Book a call' : 'Get started'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
