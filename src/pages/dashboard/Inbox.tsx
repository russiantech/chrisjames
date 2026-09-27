import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { Page } from '@/api/types';

interface ContactRow {
  id: number;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface RequestRow {
  id: number;
  name: string;
  email: string;
  company: string | null;
  project_title: string;
  summary: string;
  status: string;
  lead_score: number;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  timeline: string | null;
  created_at: string;
}

export function Inbox() {
  const [tab, setTab] = useState<'messages' | 'requests'>('messages');

  return (
    <>
      <h1 className="h3 mb-2">Inbox</h1>
      <p className="text-muted mb-5">Messages from the contact form and project briefs.</p>

      <ul className="nav nav-tabs mb-5">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'messages' ? 'active' : ''}`}
            onClick={() => setTab('messages')}
          >
            Messages
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Project briefs
          </button>
        </li>
      </ul>

      {tab === 'messages' ? <Messages /> : <Requests />}
    </>
  );
}

function Messages() {
  const { data, isLoading } = useQuery({
    queryKey: ['inbox', 'messages'],
    queryFn: () => api.get<Page<ContactRow>>('/inbox/messages', { perPage: 50 }),
  });

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!data || data.items.length === 0) return <p className="text-muted">No messages yet.</p>;

  return (
    <div className="d-flex flex-column gap-3">
      {data.items.map((message) => (
        <div className="card border shadow-none" key={message.id}>
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div>
                <h2 className="h6 mb-1">{message.subject}</h2>
                <p className="text-sm text-muted mb-0">
                  {message.name} &lt;{message.email}&gt;
                  {message.company && ` · ${message.company}`}
                </p>
              </div>
              <div className="text-end">
                <span
                  className={`badge rounded-pill text-capitalize bg-${
                    message.status === 'unread' ? 'danger' : 'secondary'
                  } bg-opacity-10 text-${message.status === 'unread' ? 'danger' : 'muted'}`}
                >
                  {message.status}
                </span>
                <span className="d-block text-xs text-muted mt-1">
                  {new Date(message.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>
              {message.message}
            </p>
            <a
              className="btn btn-sm btn-neutral rounded-pill"
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
            >
              <i className="bi bi-reply me-1" />
              Reply by e-mail
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function Requests() {
  const { data, isLoading } = useQuery({
    queryKey: ['inbox', 'requests'],
    queryFn: () => api.get<Page<RequestRow>>('/inbox/requests', { perPage: 50, sort: 'score' }),
  });

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!data || data.items.length === 0) return <p className="text-muted">No briefs yet.</p>;

  return (
    <div className="d-flex flex-column gap-3">
      {data.items.map((request) => (
        <div className="card border shadow-none" key={request.id}>
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div>
                <h2 className="h6 mb-1">{request.project_title}</h2>
                <p className="text-sm text-muted mb-0">
                  {request.name}
                  {request.company && ` · ${request.company}`} &lt;{request.email}&gt;
                </p>
              </div>
              <div className="text-end">
                <span
                  className={`badge rounded-pill bg-${
                    request.lead_score >= 70 ? 'success' : request.lead_score >= 40 ? 'warning' : 'secondary'
                  } bg-opacity-10 text-${
                    request.lead_score >= 70 ? 'success' : request.lead_score >= 40 ? 'warning' : 'muted'
                  }`}
                >
                  Score {request.lead_score}
                </span>
                <span className="d-block text-xs text-muted mt-1 text-capitalize">
                  {request.status}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>
              {request.summary}
            </p>

            <div className="d-flex flex-wrap gap-4 text-sm">
              <span className="text-muted">
                <strong className="text-heading">Budget:</strong>{' '}
                {request.budget_max
                  ? `${request.currency} ${request.budget_min ?? 0}–${request.budget_max}`
                  : 'not stated'}
              </span>
              <span className="text-muted text-capitalize">
                <strong className="text-heading">Timeline:</strong>{' '}
                {request.timeline?.replace('_', ' ') ?? 'flexible'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
