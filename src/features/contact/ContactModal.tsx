import { usePublicSettings } from '@/api/hooks';
import { BriefForm, MessageForm } from '@/pages/Contact';

import { useContactModal } from './ContactModalContext';

export function ContactModal() {
  const { isOpen, mode, open, close } = useContactModal();
  const { data: settings } = usePublicSettings();

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={close} />
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-label="Get in touch"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h2 className="h5 mb-0">
                {mode === 'brief' ? 'Start a project' : 'Get in touch'}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={close} />
            </div>

            <div className="modal-body">
              <div className="d-flex justify-content-center mb-5">
                <div className="btn-group" role="group" aria-label="Contact type">
                  <button
                    type="button"
                    className={`btn btn-sm ${mode === 'message' ? 'btn-primary' : 'btn-neutral'} rounded-pill-start px-4`}
                    onClick={() => open('message')}
                  >
                    Send a message
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${mode === 'brief' ? 'btn-primary' : 'btn-neutral'} rounded-pill-end px-4`}
                    onClick={() => open('brief')}
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
    </>
  );
}
