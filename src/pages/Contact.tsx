import { describeError } from '@/api/client';
import { useState, type FormEvent } from 'react';

import { usePublicSettings, useSendContact, useSubmitRequest } from '@/api/hooks';

const SERVICE_TYPES = [
  { value: 'web', label: 'Web platform' },
  { value: 'ai', label: 'AI / data' },
  { value: 'automation', label: 'Automation' },
  { value: 'security', label: 'Security review' },
  { value: 'other', label: 'Something else' },
];

const TIMELINES = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1_month', label: 'Within a month' },
  { value: '3_months', label: 'Within three months' },
  { value: 'flexible', label: 'Flexible' },
];

export function Contact() {
  const [mode, setMode] = useState<'message' | 'brief'>('message');
  const { data: settings } = usePublicSettings();

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <header className="text-center mb-8">
              <h1 className="ls-tight font-bolder display-6 mb-3">Get in touch</h1>
              <p className="lead text-muted mb-0">
                A quick question or a whole project — either is fine.
              </p>
            </header>

            <div className="d-flex justify-content-center mb-6">
              <div className="btn-group" role="group" aria-label="Contact type">
                <button
                  type="button"
                  className={`btn ${mode === 'message' ? 'btn-primary' : 'btn-neutral'} rounded-pill-start px-4`}
                  onClick={() => setMode('message')}
                >
                  Send a message
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'brief' ? 'btn-primary' : 'btn-neutral'} rounded-pill-end px-4`}
                  onClick={() => setMode('brief')}
                >
                  Start a project
                </button>
              </div>
            </div>

            {mode === 'message' ? <MessageForm /> : <BriefForm />}

            <p className="text-center text-sm text-muted mt-5 mb-0">
              Prefer e-mail? <a href={`mailto:${settings?.owner_email ?? ''}`}>{settings?.owner_email}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageForm() {
  const send = useSendContact();
  const [form, setForm] = useState({
    name: '', email: '', company: '', subject: '', message: '', website_url: '',
  });

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send.mutate(form);
  }

  if (send.isSuccess) {
    return (
      <div className="card border shadow-none">
        <div className="card-body text-center py-8">
          <i className="bi bi-check-circle display-4 text-success" />
          <h2 className="h4 mt-4 mb-2">Message sent</h2>
          <p className="text-muted mb-0">{send.data.detail}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="card border shadow-none" onSubmit={handleSubmit}>
      <div className="card-body">
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label" htmlFor="name">Your name</label>
            <input
              id="name"
              className="form-control"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="company">Company <span className="text-muted">(optional)</span></label>
            <input
              id="company"
              className="form-control"
              value={form.company}
              onChange={(event) => update('company', event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="subject">Subject</label>
            <input
              id="subject"
              className="form-control"
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              className="form-control"
              rows={6}
              value={form.message}
              onChange={(event) => update('message', event.target.value)}
              required
              minLength={10}
            />
          </div>
        </div>

        <input
          type="text"
          value={form.website_url}
          onChange={(event) => update('website_url', event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px' }}
        />

        {send.isError && (
          <div className="alert alert-danger mt-4 mb-0">{describeError(send.error)}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary rounded-pill px-5 mt-4"
          disabled={send.isPending}
        >
          {send.isPending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}

export function BriefForm() {
  const submit = useSubmitRequest();
  const [form, setForm] = useState<Record<string, any>>({
    name: '', email: '', company: '', phone: '',
    project_title: '', summary: '', service_types: [] as string[],
    budget_min: '', budget_max: '', timeline: 'flexible', website_url: '',
  });

  function update(field: string, value: unknown) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleService(value: string) {
    const current: string[] = form.service_types;
    update(
      'service_types',
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit.mutate({
      ...form,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
    });
  }

  if (submit.isSuccess) {
    return (
      <div className="card border shadow-none">
        <div className="card-body text-center py-8">
          <i className="bi bi-clipboard-check display-4 text-success" />
          <h2 className="h4 mt-4 mb-2">Brief received</h2>
          <p className="text-muted mb-1">{submit.data.message}</p>
          <p className="text-sm text-muted mb-0">
            Your reference is <strong>{submit.data.reference}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="card border shadow-none" onSubmit={handleSubmit}>
      <div className="card-body">
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label" htmlFor="b-name">Your name</label>
            <input id="b-name" className="form-control" value={form.name}
              onChange={(event) => update('name', event.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="b-email">E-mail</label>
            <input id="b-email" type="email" className="form-control" value={form.email}
              onChange={(event) => update('email', event.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="b-company">Company</label>
            <input id="b-company" className="form-control" value={form.company}
              onChange={(event) => update('company', event.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="b-phone">Phone <span className="text-muted">(optional)</span></label>
            <input id="b-phone" className="form-control" value={form.phone}
              onChange={(event) => update('phone', event.target.value)} />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="b-title">What are you building?</label>
            <input id="b-title" className="form-control" value={form.project_title}
              onChange={(event) => update('project_title', event.target.value)} required
              placeholder="A one-line description" />
          </div>

          <div className="col-12">
            <span className="form-label d-block">What kind of help?</span>
            <div className="d-flex flex-wrap gap-2">
              {SERVICE_TYPES.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  className={`btn btn-sm rounded-pill ${
                    form.service_types.includes(service.value) ? 'btn-primary' : 'btn-neutral'
                  }`}
                  onClick={() => toggleService(service.value)}
                  aria-pressed={form.service_types.includes(service.value)}
                >
                  {service.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="b-summary">Tell me more</label>
            <textarea id="b-summary" className="form-control" rows={6} value={form.summary}
              onChange={(event) => update('summary', event.target.value)} required minLength={20}
              placeholder="What exists today, what should exist instead, and what is getting in the way." />
          </div>

          <div className="col-md-4">
            <label className="form-label" htmlFor="b-min">Budget from</label>
            <input id="b-min" type="number" className="form-control" value={form.budget_min}
              onChange={(event) => update('budget_min', event.target.value)} min={0} />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="b-max">Budget to</label>
            <input id="b-max" type="number" className="form-control" value={form.budget_max}
              onChange={(event) => update('budget_max', event.target.value)} min={0} />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="b-timeline">Timeline</label>
            <select id="b-timeline" className="form-select" value={form.timeline}
              onChange={(event) => update('timeline', event.target.value)}>
              {TIMELINES.map((timeline) => (
                <option key={timeline.value} value={timeline.value}>{timeline.label}</option>
              ))}
            </select>
          </div>
        </div>

        <input type="text" value={form.website_url}
          onChange={(event) => update('website_url', event.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px' }} />

        {submit.isError && (
          <div className="alert alert-danger mt-4 mb-0">{describeError(submit.error)}</div>
        )}

        <button type="submit" className="btn btn-primary rounded-pill px-5 mt-4"
          disabled={submit.isPending}>
          {submit.isPending ? 'Sending…' : 'Send the brief'}
        </button>
      </div>
    </form>
  );
}
