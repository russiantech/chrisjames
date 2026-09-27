import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

import { usePost, useReact, useRecordView, useRelatedPosts } from '@/api/hooks';
import { AdSlot } from '@/components/ads/AdSlot';
import { BlockRenderer } from '@/components/blog/BlockRenderer';
import { Comments } from '@/components/blog/Comments';
import { PostCard } from '@/components/blog/PostCard';

const REACTIONS = [
  { type: 'like', icon: 'bi-hand-thumbs-up', label: 'Useful' },
  { type: 'love', icon: 'bi-heart', label: 'Loved it' },
  { type: 'insightful', icon: 'bi-lightbulb', label: 'Insightful' },
  { type: 'dislike', icon: 'bi-hand-thumbs-down', label: 'Not for me' },
];

export function PostDetail() {
  const { slug = '' } = useParams();
  const { data: post, isLoading, isError, error } = usePost(slug);
  const { data: related } = useRelatedPosts(slug);
  const react = useReact(slug);
  const recordView = useRecordView();

  const startedAt = useRef(Date.now());
  const deepestScroll = useRef(0);
  const reported = useRef(false);

  // One view is logged per visit, on the way out, with the depth reached.
  useEffect(() => {
    if (!post) return;
    startedAt.current = Date.now();
    reported.current = false;

    function onScroll() {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round((window.scrollY / scrollable) * 100);
      deepestScroll.current = Math.max(deepestScroll.current, Math.min(depth, 100));
    }

    function report() {
      if (reported.current || !post) return;
      reported.current = true;
      recordView.mutate({
        postId: post.id,
        seconds: Math.round((Date.now() - startedAt.current) / 1000),
        scroll: deepestScroll.current,
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', report);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', report);
      report();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="container py-10 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="cj-sr-only">Loading</span>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="container py-10 text-center">
        <i className="bi bi-file-earmark-x display-4 text-muted" />
        <h1 className="h3 mt-4">That post is not here</h1>
        <p className="text-muted">{(error as Error)?.message ?? 'It may have moved or been removed.'}</p>
        <Link className="btn btn-primary rounded-pill" to="/blog">
          Back to the blog
        </Link>
      </div>
    );
  }

  const published = post.published_at ?? post.created_at;

  return (
    <article className="py-8">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="breadcrumb text-sm mb-0">
                <li className="breadcrumb-item">
                  <Link to="/blog">Blog</Link>
                </li>
                {post.category && (
                  <li className="breadcrumb-item">
                    <Link to={`/blog?category=${post.category.slug}`}>{post.category.name}</Link>
                  </li>
                )}
                <li className="breadcrumb-item active" aria-current="page">
                  {post.title}
                </li>
              </ol>
            </nav>

            {post.status !== 'published' && (
              <div className="alert alert-warning d-flex align-items-center gap-2" role="status">
                <i className="bi bi-eye-slash" />
                <span>
                  This is a <strong className="text-capitalize">{post.status}</strong> — only you and
                  editors can see it.
                </span>
              </div>
            )}

            <header className="mb-6">
              <h1 className="ls-tight font-bolder display-6 mb-3">{post.title}</h1>
              {post.subtitle && <p className="lead text-muted mb-4">{post.subtitle}</p>}

              <div className="d-flex flex-wrap align-items-center gap-3 text-sm text-muted">
                <span className="fw-semibold text-heading">{post.byline}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={published}>
                  {new Date(published).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.reading_minutes} min read</span>
                <span aria-hidden="true">·</span>
                <span>
                  <i className="bi bi-eye me-1" />
                  {post.view_count}
                </span>
                {post.can_edit && (
                  <Link className="btn btn-sm btn-neutral rounded-pill ms-auto" to={`/dashboard/posts/${post.slug}/edit`}>
                    <i className="bi bi-pencil me-1" />
                    Edit
                  </Link>
                )}
              </div>
            </header>

            {post.cover_url && (
              <img
                src={post.cover_url}
                alt=""
                className="img-fluid rounded-4 mb-6 w-100"
                style={{ aspectRatio: '16 / 8', objectFit: 'cover' }}
              />
            )}

            <BlockRenderer blocks={post.blocks} polls={post.polls} postSlug={post.slug} />

            {post.tags.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-8">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/blog?tag=${tag.slug}`}
                    className="badge bg-secondary bg-opacity-10 text-muted rounded-pill text-decoration-none px-3 py-2"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {post.allow_reactions && (
              <div className="d-flex flex-wrap align-items-center gap-2 mt-6 pt-6 border-top">
                <span className="text-sm text-muted me-2">Was this any good?</span>
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    className={`btn btn-sm rounded-pill ${
                      post.my_reaction === reaction.type ? 'btn-primary' : 'btn-neutral'
                    }`}
                    onClick={() => react.mutate({ postId: post.id, type: reaction.type })}
                    disabled={react.isPending}
                  >
                    <i className={`bi ${reaction.icon} me-1`} />
                    {reaction.label}
                  </button>
                ))}
                {post.reaction_count > 0 && (
                  <span className="text-sm text-muted ms-2">{post.reaction_count} so far</span>
                )}
              </div>
            )}

            {post.show_ads && (
              <AdSlot
                slotKey="in_article_1"
                className="my-8"
                category={post.category?.slug}
                postId={post.id}
                tags={post.tags.map((tag) => tag.slug)}
              />
            )}

            <Comments postId={post.id} allowed={post.allow_comments} />
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-10 pt-8 border-top">
            <h2 className="h4 mb-5">Keep reading</h2>
            <div className="row g-5">
              {related.map((item) => (
                <div className="col-md-4" key={item.id}>
                  <PostCard post={item} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
