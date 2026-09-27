import { Outlet, ScrollRestoration } from 'react-router-dom';

import { AdSlot } from '@/components/ads/AdSlot';
import { ContactModal } from '@/features/contact/ContactModal';

import { Footer } from './Footer';
import { Navbar } from './Navbar';

// Dropdowns in this app are plain React state (see useOutsideClick) rather
// than Bootstrap's dropdown.js + Popper, so there's no JS module to
// re-attach on route change here.
export function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Ad placement sits just above the footer, not inside/after it. */}
      <div className="py-6 bg-surface-secondary border-top">
        <div className="container">
          <AdSlot slotKey="footer_banner" />
        </div>
      </div>

      <Footer />
      <ContactModal />
      <ScrollRestoration />
    </div>
  );
}
