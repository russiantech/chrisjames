import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { api, describeError } from '@/api/client';
import { useCategories, usePublicSettings, useSubmitGuestPost } from '@/api/hooks';
import type { BlockType } from '@/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { PALETTE, nextKey, BlockEditor, type DraftBlock } from '@/features/editor/BlockEditor';

export function Write() {
  const { user } = useAuth();
  const { data: settings } = usePublicSettings();
  const { data: categories } = useCategories();
  const guestSubmit = useSubmitGuestPost();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [blocks, setBlocks] = useState<DraftBlock[]>([
    { key: nextKey(), type: 'markdown', data: { source: '' } },
  ]);
  const [poll, setPoll] = useState({ question: '', options: ['', ''] });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guestsWelcome = settings?.guest_posts_enabled !== false;

  function addBlock(type: BlockType) {
    const template = PALETTE.find((entry) => entry.type === type);
    setBlocks((current) => [
      ...current,
      { key: nextKey(), type, data: { ...(template?.blank ?? {}) } },
    ]);
  }

  function updateBlock(key: string, patch: Record<string, any>) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === key ? { ...block, data: { ...block.data, ...patch } } : block,
      ),
    );
  }

  function removeBlock(key: string) {
    setBlocks((current) => current.filter((block) => block.key !== key));
  }

  function moveBlock(index: number, delta: number) {
    setBlocks((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function buildPayload() {
    const serialised = blocks.map((block) => {
      if (block.type === 'poll') {
        return {
          type: 'poll',
          data: {},
          poll: {
            question: poll.question,
            options: poll.options
              .filter((option) => option.trim())
              .map((option) => ({ label: option.trim() })),
          },
        };
      }
      return { type: block.type, data: block.data };
    });

    return {
      title,
      subtitle: subtitle || null,
      excerpt: excerpt || null,
      category_id: categoryId ? Number(categoryId) : null,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      blocks: serialised,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = buildPayload();

    try {
      if (user) {
        // A member posts through the authenticated route. The API decides
        // whether that lands published or in the review queue.
        await api.post('/posts', { ...payload, status: 'published' });
        setResult(
          'Sent. If you have publishing rights it is live; otherwise it is waiting for review.',
        );
      } else {
        const response = await guestSubmit.mutateAsync({
          ...payload,
          guest_name: guestName,
          guest_email: guestEmail,
        });
        setResult(response.detail);
      }
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="container py-10">
        <div className="row justify-content-center">
          <div className="col-md-7 text-center">
            <i className="bi bi-send-check display-4 text-success" />
            <h1 className="h3 mt-4 mb-2">Thanks for writing</h1>
            <p className="text-muted mb-4">{result}</p>
            <Link className="btn btn-primary rounded-pill" to="/blog">
              Back to the blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !guestsWelcome) {
    return (
      <div className="container py-10 text-center">
        <i className="bi bi-lock display-4 text-muted" />
        <h1 className="h3 mt-4">Submissions are closed right now</h1>
        <p className="text-muted">
          <Link to="/login">Sign in</Link> if you have an account.
        </p>
      </div>
    );
  }

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <header className="mb-6">
              <h1 className="ls-tight font-bolder display-6 mb-3">Write a post</h1>
              <p className="lead text-muted mb-0">
                {user
                  ? 'Build the post from blocks. Code, images, video, audio and polls all work.'
                  : 'Anyone can contribute. Submissions are read before they go live.'}
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="card border shadow-none mb-5">
                <div className="card-body">
                  <div className="mb-4">
                    <label className="form-label" htmlFor="w-title">Title</label>
                    <input id="w-title" className="form-control form-control-lg" value={title}
                      onChange={(event) => setTitle(event.target.value)} required minLength={3} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label" htmlFor="w-subtitle">
                      Subtitle <span className="text-muted">(optional)</span>
                    </label>
                    <input id="w-subtitle" className="form-control" value={subtitle}
                      onChange={(event) => setSubtitle(event.target.value)} />
                  </div>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="w-category">Topic</label>
                      <select id="w-category" className="form-select" value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}>
                        <option value="">Uncategorised</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="w-tags">Tags</label>
                      <input id="w-tags" className="form-control" value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        placeholder="python, architecture" />
                      <div className="form-text">Comma separated.</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="w-excerpt">
                        Summary <span className="text-muted">(optional — one is generated if you skip it)</span>
                      </label>
                      <textarea id="w-excerpt" className="form-control" rows={2} value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------ blocks */}
              <div className="d-flex flex-column gap-4 mb-5">
                {blocks.map((block, index) => (
                  <div className="card border shadow-none" key={block.key}>
                    <div className="card-header d-flex align-items-center gap-2 py-2">
                      <i className={`bi ${PALETTE.find((entry) => entry.type === block.type)?.icon ?? 'bi-square'} text-muted`} />
                      <span className="text-sm fw-semibold text-capitalize">{block.type.replace('_', ' ')}</span>
                      <div className="ms-auto d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-neutral btn-square"
                          onClick={() => moveBlock(index, -1)} disabled={index === 0}
                          aria-label="Move up">
                          <i className="bi bi-arrow-up" />
                        </button>
                        <button type="button" className="btn btn-sm btn-neutral btn-square"
                          onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}
                          aria-label="Move down">
                          <i className="bi bi-arrow-down" />
                        </button>
                        <button type="button" className="btn btn-sm btn-neutral btn-square text-danger"
                          onClick={() => removeBlock(block.key)} aria-label="Remove block">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <BlockEditor
                        block={block}
                        onChange={(patch) => updateBlock(block.key, patch)}
                        poll={poll}
                        setPoll={setPoll}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card border shadow-none bg-surface-secondary mb-5">
                <div className="card-body">
                  <p className="text-sm fw-semibold mb-3">Add a block</p>
                  <div className="d-flex flex-wrap gap-2">
                    {PALETTE.map((entry) => (
                      <button key={entry.type} type="button"
                        className="btn btn-sm btn-neutral rounded-pill"
                        onClick={() => addBlock(entry.type)}>
                        <i className={`bi ${entry.icon} me-1`} />
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!user && (
                <div className="card border shadow-none mb-5">
                  <div className="card-body">
                    <p className="text-sm fw-semibold mb-3">Who is writing?</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Your name" value={guestName}
                          onChange={(event) => setGuestName(event.target.value)} required
                          aria-label="Your name" />
                      </div>
                      <div className="col-md-6">
                        <input type="email" className="form-control" placeholder="you@example.com"
                          value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)}
                          required aria-label="Your e-mail" />
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-2 mb-0">
                      Used for the byline and to tell you the outcome. Not published.
                    </p>
                  </div>
                </div>
              )}

              {error && <div className="alert alert-danger">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5"
                disabled={busy || !title.trim()}>
                {busy ? 'Sending…' : user ? 'Publish' : 'Submit for review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

