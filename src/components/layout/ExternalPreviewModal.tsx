interface Props {
  url: string;
  label: string;
  onClose: () => void;
}

/**
 * Attempts to preview an external site in an iframe. Embedding costs nothing
 * beyond the visitor's own request — there's no rendering service or API
 * behind this — but plenty of sites refuse to be framed (X-Frame-Options,
 * frame-ancestors), and a cross-origin iframe gives no reliable way to detect
 * that from JavaScript. So the fallback link is always shown, not just on
 * failure: if the preview stays blank, "open externally" is right there.
 */
export function ExternalPreviewModal({ url, label, onClose }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content" style={{ height: '85vh' }}>
            <div className="modal-header border-bottom py-2">
              <span className="h6 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-window" />
                {label}
              </span>
              <div className="d-flex align-items-center gap-2 ms-auto">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-neutral rounded-pill"
                >
                  Open in a new tab
                  <i className="bi bi-box-arrow-up-right ms-2" />
                </a>
                <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
              </div>
            </div>
            <div className="modal-body p-0 d-flex flex-column">
              <p className="text-xs text-muted text-center mb-0 py-1 bg-surface-secondary">
                Previewing {url} — some sites block embedding; use "Open in a new tab" if this stays blank.
              </p>
              <iframe
                src={url}
                title={label}
                className="flex-grow-1 border-0 w-100"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
