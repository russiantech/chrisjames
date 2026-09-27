import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useCategories, usePosts, type PostFilters } from '@/api/hooks';
import { AdSlot } from '@/components/ads/AdSlot';
import { PostCard } from '@/components/blog/PostCard';

export function Blog() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');

  const filters: PostFilters = {
    page: Number(params.get('page') ?? 1),
    perPage: 9,
    q: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    tag: params.get('tag') ?? undefined,
    sort: (params.get('sort') as PostFilters['sort']) ?? 'recent',
  };

  const { data, isLoading } = usePosts(filters);
  const { data: categories } = useCategories();

  function update(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value);
      else merged.delete(key);
    });
    if (!('page' in next)) merged.delete('page');
    setParams(merged);
  }

  return (
    <div className="cj-section">
      <div className="container">
        <header className="mb-8">
          <h1 className="ls-tight font-bolder display-6 mb-3">Writing</h1>
          <p className="lead text-muted mb-0">
            Notes on building things, and on the parts that turned out harder than expected.
          </p>
        </header>

        <div className="row g-8">
          <div className="col-lg-8">
            <form
              className="d-flex gap-2 mb-5"
              onSubmit={(event) => {
                event.preventDefault();
                update({ q: term.trim() || undefined });
              }}
            >
              <input
                className="form-control"
                placeholder="Search posts…"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search posts"
              />
              <select
                className="form-select w-auto"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value })}
                aria-label="Sort posts"
              >
                <option value="recent">Newest</option>
                <option value="popular">Most read</option>
                <option value="commented">Most discussed</option>
                <option value="oldest">Oldest</option>
              </select>
            </form>

            {isLoading && <p className="text-muted">Loading posts…</p>}

            {data && data.items.length === 0 && (
              <div className="text-center py-10">
                <i className="bi bi-journal-text display-4 text-muted" />
                <p className="text-muted mt-3 mb-0">Nothing here yet. Check back soon.</p>
              </div>
            )}

            <div className="row g-5">
              {data?.items.map((post, index) => (
                <div className="col-sm-6" key={post.id}>
                  <PostCard post={post} />
                  {index === 3 && (
                    <div className="d-sm-none mt-5">
                      <AdSlot slotKey="feed_native" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {data && data.pages > 1 && (
              <nav className="mt-8" aria-label="Posts">
                <ul className="pagination justify-content-center mb-0">
                  <li className={`page-item ${data.has_prev ? '' : 'disabled'}`}>
                    <button
                      className="page-link"
                      onClick={() => update({ page: String(data.page - 1) })}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: data.pages }).map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${data.page === index + 1 ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => update({ page: String(index + 1) })}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${data.has_next ? '' : 'disabled'}`}>
                    <button
                      className="page-link"
                      onClick={() => update({ page: String(data.page + 1) })}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>

          <aside className="col-lg-4">
            <div className="position-sticky" style={{ top: '6rem' }}>
              <div className="card border shadow-none mb-5">
                <div className="card-body">
                  <h2 className="h6 text-uppercase text-muted mb-3">Topics</h2>
                  <div className="d-flex flex-column gap-1">
                    <button
                      className={`btn btn-sm text-start ${!filters.category ? 'btn-primary' : 'btn-link text-heading'}`}
                      onClick={() => update({ category: undefined })}
                    >
                      Everything
                    </button>
                    {categories?.map((category) => (
                      <button
                        key={category.id}
                        className={`btn btn-sm text-start d-flex align-items-center ${
                          filters.category === category.slug ? 'btn-primary' : 'btn-link text-heading'
                        }`}
                        onClick={() => update({ category: category.slug })}
                      >
                        {category.icon && <i className={`bi ${category.icon} me-2`} />}
                        {category.name}
                        <span className="ms-auto text-xs opacity-75">{category.post_count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card border shadow-none mb-5 bg-surface-secondary">
                <div className="card-body">
                  <h2 className="h6 mb-2">Have something to say?</h2>
                  <p className="text-sm text-muted mb-3">
                    Anyone can submit a post. Approved pieces get published with your byline.
                  </p>
                  <Link className="btn btn-sm btn-primary rounded-pill" to="/write">
                    Write a post
                  </Link>
                </div>
              </div>

              <AdSlot slotKey="sidebar_primary" category={filters.category} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
