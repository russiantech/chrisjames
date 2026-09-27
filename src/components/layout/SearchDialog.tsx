import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSearch } from '@/api/hooks';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: Props) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setTerm('');
  }, [open]);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  const { data, isFetching } = useSearch(debounced);
  const hasResults = useMemo(
    () => Boolean(data && (data.posts.length > 0 || data.projects.length > 0)),
    [data],
  );

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom py-2">
              <i className="bi bi-search text-muted me-2" />
              <input
                ref={inputRef}
                className="form-control border-0 shadow-none"
                placeholder="Search posts and projects…"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search"
              />
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {term.trim().length < 2 && (
                <p className="text-muted text-sm mb-0">Type at least two characters.</p>
              )}
              {term.trim().length >= 2 && isFetching && (
                <p className="text-muted text-sm mb-0">Searching…</p>
              )}
              {term.trim().length >= 2 && !isFetching && !hasResults && (
                <p className="text-muted text-sm mb-0">Nothing matched “{term}”.</p>
              )}

              {data && data.posts.length > 0 && (
                <>
                  <h6 className="text-uppercase text-xs text-muted mt-2">Posts</h6>
                  <ul className="list-unstyled mb-3">
                    {data.posts.map((post) => (
                      <li key={post.id}>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="d-block py-2 px-2 rounded-2 text-decoration-none text-heading"
                          onClick={onClose}
                        >
                          <span className="d-block fw-semibold">{post.title}</span>
                          {post.excerpt && (
                            <span className="d-block text-sm text-muted cj-line-clamp-2">
                              {post.excerpt}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {data && data.projects.length > 0 && (
                <>
                  <h6 className="text-uppercase text-xs text-muted">Projects</h6>
                  <ul className="list-unstyled mb-0">
                    {data.projects.map((project) => (
                      <li key={project.id}>
                        <Link
                          to={`/projects/${project.slug}`}
                          className="d-block py-2 px-2 rounded-2 text-decoration-none text-heading"
                          onClick={onClose}
                        >
                          <span className="d-block fw-semibold">{project.title}</span>
                          {project.tagline && (
                            <span className="d-block text-sm text-muted">{project.tagline}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
