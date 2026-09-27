import { useState } from 'react';

import { useCommentQueue, useModerateComment } from '@/api/hooks';

const STATES = [
  { value: 'pending', label: 'Waiting' },
  { value: 'spam', label: 'Spam' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'approved', label: 'Approved' },
];

export function CommentQueue() {
  const [state, setState] = useState('pending');
  const { data, isLoading } = useCommentQueue(state);
  const moderate = useModerateComment();

  return (
    <>
      <h1 className="h3 mb-2">Comments</h1>
      <p className="text-muted mb-5">
        Anything the spam heuristics flagged, plus whatever readers reported.
      </p>

      <div className="btn-group mb-5" role="group" aria-label="Filter by state">
        {STATES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn btn-sm ${state === option.value ? 'btn-primary' : 'btn-neutral'}`}
            onClick={() => setState(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}

      {data && data.items.length === 0 && (
        <p className="text-muted">Nothing in this bucket.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {data?.items.map((comment) => (
          <div className="card border shadow-none" key={comment.id}>
            <div className="card-body">
              <div className="d-flex justify-content-between gap-3 mb-2">
                <span className="fw-semibold text-sm">{comment.display_name}</span>
                <span className="text-xs text-muted">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <div
                className="text-sm mb-3"
                dangerouslySetInnerHTML={{ __html: comment.body_html }}
              />
              <div className="d-flex flex-wrap gap-2">
                {state !== 'approved' && (
                  <button
                    className="btn btn-sm btn-primary rounded-pill"
                    onClick={() => moderate.mutate({ id: comment.id, state: 'approved' })}
                  >
                    Approve
                  </button>
                )}
                {state !== 'spam' && (
                  <button
                    className="btn btn-sm btn-neutral rounded-pill"
                    onClick={() => moderate.mutate({ id: comment.id, state: 'spam' })}
                  >
                    Mark spam
                  </button>
                )}
                <button
                  className="btn btn-sm btn-neutral rounded-pill text-danger"
                  onClick={() =>
                    moderate.mutate({ id: comment.id, state: 'hidden', cascade: true })
                  }
                >
                  Hide thread
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
