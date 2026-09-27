import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useNotificationCounts, usePublicSettings } from '@/api/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { useContactModal } from '@/features/contact/ContactModalContext';
import { useOutsideClick } from '@/hooks/useOutsideClick';

import { ExternalPreviewModal } from './ExternalPreviewModal';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { SearchDialog } from './SearchDialog';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Work' },
  { to: '/services', label: 'Services' },
  { to: '/blog', label: 'Blog' },
];

/** The products menu from the original page, pointed at the real projects. */
const PRODUCTS = [
  { href: 'https://salesnet.ng', icon: 'bi bi-shop', accent: 'text-warning', label: 'Salesnet' },
  { href: 'https://intellect.salesnet.ng', icon: 'bi bi-mortarboard', accent: 'text-primary', label: 'Intellect' },
  { href: 'https://stitch-client-app.vercel.app', icon: 'bi bi-basket', accent: 'text-success', label: 'Stitch' },
  { href: 'https://techa.salesnet.ng', icon: 'bi bi-rocket-takeoff', accent: 'text-secondary', label: 'Techa' },
];

export function Navbar() {
  const { user, signOut, can } = useAuth();
  const { data: settings } = usePublicSettings();
  const { data: counts } = useNotificationCounts();
  const { open: openContact } = useContactModal();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);

  const productsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useOutsideClick(productsRef, () => setProductsOpen(false), productsOpen);
  useOutsideClick(accountRef, () => setAccountOpen(false), accountOpen);

  // Cmd/Ctrl-K opens search, the way the rest of the web has taught people.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A body class keeps the page from scrolling behind the open mobile sheet.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    setAccountOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  function openPreview(product: { href: string; label: string }) {
    setPreview({ url: product.href, label: product.label });
    setProductsOpen(false);
  }

  return (
    <>
      <nav
        className="navbar navbar-main navbar-expand-lg position-sticky top-0 navbar-light bg-white py-2 py-lg-1 px-0 border-bottom"
        id="navbar_main"
        style={{ zIndex: 1030 }}
      >
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <div className="w-md-auto text-dark">
              <Logo />
            </div>
            <span className="text-heading h4 font-bold ls-tight mb-0">
              {settings?.owner_name_short ?? settings?.site_title ?? 'Chris-James'}
            </span>
          </Link>

          <div className="d-flex">
            <div className="navbar-nav order-lg-3 me-2 d-flex align-items-center text-center">
              {/* React-controlled, not Bootstrap's dropdown JS — that combination
                  with Popper's auto-repositioning was what flickered on mobile.
                  Visible at every breakpoint: it is the only way to reach the
                  live products (Salesnet, Intellect, Stitch, Techa) from here. */}
              <div className="dropdown position-relative" ref={productsRef}>
                <button
                  type="button"
                  className="btn btn-sm p-0 border-0 bg-transparent d-flex align-items-center"
                  onClick={() => setProductsOpen((current) => !current)}
                  aria-haspopup="true"
                  aria-expanded={productsOpen}
                  aria-label="Products"
                  title="Products"
                >
                  <div className="avatar avatar-sm bg-default text-primary rounded-circle">
                    <i className="bi bi-grid-fill text-primary text-xl" />
                  </div>
                </button>
                <div
                  className={`dropdown-menu dropdown-menu-end${productsOpen ? ' show' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    left: 'auto',
                    minWidth: '12rem',
                    zIndex: 1040,
                  }}
                >
                  <div className="dropdown-header">
                    <span className="d-block text-sm text-muted mb-1">Products</span>
                  </div>
                  <div className="dropdown-divider" />
                  {PRODUCTS.map((product) => (
                    <button
                      key={product.label}
                      type="button"
                      className="dropdown-item"
                      onClick={() => openPreview(product)}
                    >
                      <i className={`${product.icon} me-3 ${product.accent}`} />
                      {product.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="navbar-toggler rounded-pill btn-outline-primary me-n2 ms-auto text-start"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <span className="navbar-toggler-icon" />
            </button>
          </div>

          <div className="collapse navbar-collapse justify-content-center order-lg-3 ms-lg-5">
            <ul className="navbar-nav align-items-lg-center">
              {LINKS.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link${isActive ? ' active fw-semibold text-primary' : ''}`
                    }
                    to={link.to}
                    end={link.end}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="navbar-nav order-lg-4 d-none d-lg-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-neutral rounded-pill d-flex align-items-center gap-2"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <i className="bi bi-search" />
              <span className="text-muted text-xs d-none d-xl-inline">
                <kbd className="bg-transparent border-0 p-0">⌘K</kbd>
              </span>
            </button>

            {user ? (
              <>
                <NotificationBell unread={counts?.unread ?? 0} />
                <div className="dropdown position-relative" ref={accountRef}>
                  <button
                    className="btn btn-sm btn-neutral rounded-pill d-flex align-items-center gap-2"
                    type="button"
                    onClick={() => setAccountOpen((current) => !current)}
                    aria-haspopup="true"
                    aria-expanded={accountOpen}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="avatar avatar-xs rounded-circle"
                      />
                    ) : (
                      <i className="bi bi-person-circle" />
                    )}
                    <span className="d-none d-xl-inline">{user.display_name}</span>
                  </button>
                  <div
                    className={`dropdown-menu dropdown-menu-end${accountOpen ? ' show' : ''}`}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: 0,
                      left: 'auto',
                      minWidth: '14rem',
                      zIndex: 1040,
                    }}
                  >
                    <div className="dropdown-header">
                      <span className="d-block text-sm fw-semibold">{user.display_name}</span>
                      <span className="d-block text-xs text-muted">{user.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    {can('analytics:read', 'post:create', 'inbox:read') && (
                      <Link className="dropdown-item" to="/dashboard" onClick={() => setAccountOpen(false)}>
                        <i className="bi bi-speedometer2 me-2" />
                        Dashboard
                      </Link>
                    )}
                    <Link className="dropdown-item" to="/write" onClick={() => setAccountOpen(false)}>
                      <i className="bi bi-pencil-square me-2" />
                      Write a post
                    </Link>
                    <Link className="dropdown-item" to="/notifications" onClick={() => setAccountOpen(false)}>
                      <i className="bi bi-bell me-2" />
                      Notifications
                      {(counts?.unread ?? 0) > 0 && (
                        <span className="badge bg-danger rounded-pill ms-2">
                          {counts?.unread}
                        </span>
                      )}
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item text-danger" onClick={handleSignOut}>
                      <i className="bi bi-box-arrow-right me-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link className="btn btn-sm btn-neutral rounded-pill" to="/login">
                Sign in
              </Link>
            )}

            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill"
              onClick={() => openContact('brief')}
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet — the original used a Bootstrap modal (#mobile_nav). */}
      {mobileOpen && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setMobileOpen(false)} />
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-fullscreen-sm-down modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header border-bottom">
                  <span className="h5 mb-0 d-flex align-items-center gap-2">
                    <Logo className="w-auto h-6" />
                    Menu
                  </span>
                  <button
                    type="button"
                    ref={closeRef}
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setMobileOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <ul className="list-unstyled d-flex flex-column gap-1 mb-4">
                    {LINKS.map((link) => (
                      <li key={link.to}>
                        <NavLink
                          to={link.to}
                          end={link.end}
                          className={({ isActive }) =>
                            `d-block py-2 px-3 rounded-2 text-decoration-none ${
                              isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-heading'
                            }`
                          }
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>

                  <div className="border-top pt-3 d-flex flex-column gap-2">
                    {user ? (
                      <>
                        <Link
                          className="btn btn-neutral rounded-pill w-100"
                          to="/dashboard"
                          onClick={() => setMobileOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button className="btn btn-link text-danger" onClick={handleSignOut}>
                          Sign out
                        </button>
                      </>
                    ) : (
                      <Link
                        className="btn btn-neutral rounded-pill w-100"
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                      >
                        Sign in
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill w-100"
                      onClick={() => {
                        setMobileOpen(false);
                        openContact('brief');
                      }}
                    >
                      Get started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {preview && (
        <ExternalPreviewModal
          url={preview.url}
          label={preview.label}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
