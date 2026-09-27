import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { describeError } from '@/api/client';
import { usePublicSettings, useSubscribe } from '@/api/hooks';

import { Logo } from './Logo';

const SOCIALS = [
  { href: 'https://twitter.com/chris_jsmes', icon: 'bi-twitter-x', label: 'X' },
  { href: 'https://www.facebook.com/RussianTechs', icon: 'bi-facebook', label: 'Facebook' },
  { href: 'https://github.com/russiantech', icon: 'bi-github', label: 'GitHub' },
  { href: 'https://www.instagram.com/chrisjsmz/', icon: 'bi-instagram', label: 'Instagram' },
  { href: 'https://www.linkedin.com/in/chrisjsm', icon: 'bi-linkedin', label: 'LinkedIn' },
];

export function Footer() {
  const { data: settings } = usePublicSettings();
  const subscribe = useSubscribe();
  const [email, setEmail] = useState('');

  function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ email: email.trim(), source: 'footer' });
  }

  return (
    <footer className="py-10 bg-surface-secondary border-top mt-auto">
      <div className="container">
        <div className="row g-6">
          <div className="col-lg-4">
            <Link className="d-flex align-items-center gap-2 text-decoration-none mb-3" to="/">
              <Logo />
              <span className="text-heading h5 font-bold ls-tight mb-0">
                {settings?.site_title ?? 'Christopher James'}
              </span>
            </Link>
            <p className="text-sm text-muted mb-4">
              {settings?.site_tagline ?? 'Software engineer. AI, data and security.'}
            </p>
            <ul className="list-inline mb-0">
              {SOCIALS.map((social) => (
                <li className="list-inline-item" key={social.label}>
                  <a
                    className="btn btn-sm btn-neutral btn-square rounded-circle"
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    <i className={`bi ${social.icon}`} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="text-sm font-semibold mb-3">Site</h6>
            <ul className="list-unstyled text-sm d-flex flex-column gap-2 mb-0">
              <li><Link className="text-muted text-decoration-none" to="/about">About</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/projects">Work</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/services">Services</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="text-sm font-semibold mb-3">Take part</h6>
            <ul className="list-unstyled text-sm d-flex flex-column gap-2 mb-0">
              <li><Link className="text-muted text-decoration-none" to="/write">Write a post</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/advertise">Advertise</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/contact">Contact</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/login">Sign in</Link></li>
            </ul>
          </div>

          {settings?.newsletter_enabled !== false && (
            <div className="col-lg-4">
              <h6 className="text-sm font-semibold mb-3">Occasional writing, by e-mail</h6>
              <p className="text-sm text-muted mb-3">
                New posts only. No schedule, no filler, unsubscribe in one click.
              </p>
              {subscribe.isSuccess ? (
                <div className="alert alert-success py-2 px-3 text-sm mb-0" role="status">
                  {subscribe.data.detail}
                </div>
              ) : (
                <form className="d-flex gap-2" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    aria-label="E-mail address"
                  />
                  <button
                    className="btn btn-primary rounded-pill px-4"
                    type="submit"
                    disabled={subscribe.isPending}
                  >
                    {subscribe.isPending ? '…' : 'Join'}
                  </button>
                </form>
              )}
              {subscribe.isError && (
                <p className="text-sm text-danger mt-2 mb-0">
                  {describeError(subscribe.error)}
                </p>
              )}
            </div>
          )}
        </div>

        <hr className="my-6" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <p className="text-sm text-muted mb-0">
            © {new Date().getFullYear()} {settings?.owner_name ?? 'Christopher James'}.
          </p>
          <p className="text-sm text-muted mb-0">
            Built with FastAPI and React.
          </p>
        </div>
      </div>
    </footer>
  );
}
