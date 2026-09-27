import { Link } from 'react-router-dom';

import type { PostSummary } from '@/api/types';

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PostCard({ post, horizontal = false }: { post: PostSummary; horizontal?: boolean }) {
  const body = (
    <>
      <div className="d-flex align-items-center gap-2 mb-2">
        {post.category && (
          <span className={`badge bg-${post.category.accent} bg-opacity-10 text-${post.category.accent} rounded-pill`}>
            {post.category.icon && <i className={`bi ${post.category.icon} me-1`} />}
            {post.category.name}
          </span>
        )}
        {post.status !== 'published' && (
          <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill text-capitalize">
            {post.status}
          </span>
        )}
      </div>

      <h3 className="h5 text-heading mb-2 cj-line-clamp-2">{post.title}</h3>
      {post.excerpt && <p className="text-sm text-muted mb-3 cj-line-clamp-3">{post.excerpt}</p>}

      <div className="d-flex align-items-center gap-3 text-xs text-muted mt-auto">
        <span>{post.byline}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.published_at ?? post.created_at}>
          {formatDate(post.published_at ?? post.created_at)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{post.reading_minutes} min read</span>
        {post.comment_count > 0 && (
          <span className="ms-auto">
            <i className="bi bi-chat-left-text me-1" />
            {post.comment_count}
          </span>
        )}
      </div>
    </>
  );

  if (horizontal) {
    return (
      <Link to={`/blog/${post.slug}`} className="text-decoration-none">
        <article className="card border shadow-none cj-transition h-100">
          <div className="row g-0 h-100">
            {post.cover_url && (
              <div className="col-md-4">
                <img
                  src={post.cover_url}
                  alt=""
                  loading="lazy"
                  className="cj-cover h-100 rounded-start"
                  style={{ minHeight: 160 }}
                />
              </div>
            )}
            <div className={post.cover_url ? 'col-md-8' : 'col-12'}>
              <div className="card-body d-flex flex-column h-100">{body}</div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`} className="text-decoration-none h-100 d-block">
      <article className="card border shadow-none cj-transition h-100">
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt=""
            loading="lazy"
            className="card-img-top cj-cover"
            style={{ aspectRatio: '16 / 9' }}
          />
        )}
        <div className="card-body d-flex flex-column">{body}</div>
      </article>
    </Link>
  );
}
