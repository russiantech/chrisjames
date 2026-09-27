import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useReviewPost, useReviewQueue } from '@/api/hooks';

export function ReviewQueue() {
  const { data, isLoading } = useReviewQueue();
  const review = useReviewPost();
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <h1 className="h3 mb-2">Review queue</h1>
      <p className="text-muted mb-5">
        Submissions from members and visitors. Approving publishes immediately.
      </p>

      {data && data.items.length === 0 && (
        <div className="text-center py-10">
          <i className="bi bi-check2-circle display-4 text-success" />
          <p className="text-muted mt-3 mb-0">Nothing waiting. Nice.</p>
        </div>
      )}

      <div className="d-flex flex-column gap-4">
        {data?.items.map((post) => (
          <div className="card border shadow-none" key={post.id}>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="h5 mb-1">
                    <Link to={`/blog/${post.slug}`} className="text-heading text-decoration-none">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted mb-0">
                    {post.byline} · {post.word_count} words · {post.reading_minutes} min read
                  </p>
                </div>
                {post.category && (
                  <span
                    className={`badge bg-${post.category.accent} bg-opacity-10 text-${post.category.accent} rounded-pill align-self-start`}
                  >
                    {post.category.name}
                  </span>
                )}
              </div>

              {post.excerpt && <p className="text-muted mb-4">{post.excerpt}</p>}

              {rejecting === post.id ? (
                <div>
                  <textarea
                    className="form-control mb-2"
                    rows={2}
                    placeholder="Why is it not going live? The author sees this."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-danger rounded-pill"
                      onClick={() => {
                        review.mutate({ id: post.id, approve: false, reason });
                        setRejecting(null);
                        setReason('');
                      }}
                    >
                      Send rejection
                    </button>
                    <button
                      className="btn btn-sm btn-link text-muted"
                      onClick={() => setRejecting(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  <Link className="btn btn-sm btn-neutral rounded-pill" to={`/blog/${post.slug}`}>
                    <i className="bi bi-eye me-1" />
                    Read it
                  </Link>
                  <button
                    className="btn btn-sm btn-primary rounded-pill"
                    onClick={() => review.mutate({ id: post.id, approve: true, publish: true })}
                    disabled={review.isPending}
                  >
                    <i className="bi bi-check-lg me-1" />
                    Approve and publish
                  </button>
                  <button
                    className="btn btn-sm btn-neutral rounded-pill"
                    onClick={() => review.mutate({ id: post.id, approve: true, publish: false })}
                    disabled={review.isPending}
                  >
                    Approve as draft
                  </button>
                  <button
                    className="btn btn-sm btn-neutral rounded-pill text-danger"
                    onClick={() => setRejecting(post.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
