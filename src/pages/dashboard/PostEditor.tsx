import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api, describeError } from '@/api/client';
import {
  useCategories,
  useDeletePost,
  usePollVoters,
  usePost,
  useUpdatePost,
} from '@/api/hooks';
import type { BlockType } from '@/api/types';
import { BlockEditor, PALETTE, nextKey, type DraftBlock } from '@/features/editor/BlockEditor';

export function PostEditor() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(slug);
  const { data: categories } = useCategories();
  const updatePost = useUpdatePost(slug);
  const deletePost = useDeletePost();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [blocks, setBlocks] = useState<DraftBlock[]>([]);
  const [poll, setPoll] = useState({ question: '', options: ['', ''] });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Prefill from the fetched post once — after that, the form owns the state.
  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setSubtitle(post.subtitle ?? '');
    setExcerpt(post.excerpt ?? '');
    setCategoryId(post.category ? String(post.category.id) : '');
    setTags(post.tags.map((tag) => tag.name).join(', '));
    setStatus(post.status);
    setBlocks(
      post.blocks
        .filter((block) => !block.is_hidden)
        .sort((a, b) => a.position - b.position)
        .map((block) => ({ key: nextKey(), type: block.type, data: { ...block.data } })),
    );
    const pollBlock = post.blocks.find((block) => block.type === 'poll');
    const attachedPoll = pollBlock && post.polls.find((p) => p.id === pollBlock.data.poll_id);
    if (attachedPoll) {
      setPoll({
        question: attachedPoll.question,
        options: attachedPoll.options.map((option) => option.label),
      });
    }
  }, [post]);

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

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    // Re-sent as new rows every save — sync_blocks on the server replaces
    // the whole set either way, so this keeps the editor simple with no
    // real cost beyond block ids not staying stable across edits.
    const serialisedBlocks = blocks.map((block) => {
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

    try {
      const updated = await updatePost.mutateAsync({
        title,
        subtitle: subtitle || null,
        excerpt: excerpt || null,
        category_id: categoryId ? Number(categoryId) : null,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        blocks: serialisedBlocks,
        change_note: 'Edited from the dashboard',
      });

      // Status changes run through the dedicated endpoint so the
      // review/publish notification logic fires correctly.
      if (status !== updated.status) {
        await api.post(`/posts/${slug}/status`, { status });
      }
      setSaved(true);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(slug);
      navigate('/dashboard');
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  if (isLoading) return <div className="container py-10 text-muted">Loading…</div>;

  if (isError || !post) {
    return (
      <div className="container py-10 text-center">
        <h1 className="h3">No post at that address</h1>
        <Link className="btn btn-neutral rounded-pill mt-3" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!post.can_edit) {
    return (
      <div className="container py-10 text-center">
        <i className="bi bi-shield-lock display-4 text-warning" />
        <h1 className="h3 mt-4">You cannot edit this post</h1>
        <p className="text-muted">Only the author or an editor can make changes here.</p>
        <Link className="btn btn-neutral rounded-pill" to={`/blog/${post.slug}`}>
          Back to the post
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-6">
              <div>
                <h1 className="ls-tight font-bolder display-6 mb-1">Edit post</h1>
                <Link className="text-sm text-muted" to={`/blog/${post.slug}`}>
                  View live version <i className="bi bi-box-arrow-up-right ms-1" />
                </Link>
              </div>
              <select
                className="form-select w-auto"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submit for review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <form onSubmit={handleSave}>
              <div className="card border shadow-none mb-5">
                <div className="card-body">
                  <div className="mb-4">
                    <label className="form-label" htmlFor="e-title">Title</label>
                    <input id="e-title" className="form-control form-control-lg" value={title}
                      onChange={(event) => setTitle(event.target.value)} required minLength={3} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label" htmlFor="e-subtitle">Subtitle</label>
                    <input id="e-subtitle" className="form-control" value={subtitle}
                      onChange={(event) => setSubtitle(event.target.value)} />
                  </div>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="e-category">Topic</label>
                      <select id="e-category" className="form-select" value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}>
                        <option value="">Uncategorised</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="e-tags">Tags</label>
                      <input id="e-tags" className="form-control" value={tags}
                        onChange={(event) => setTags(event.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="e-excerpt">Summary</label>
                      <textarea id="e-excerpt" className="form-control" rows={2} value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column gap-4 mb-5">
                {blocks.map((block, index) => (
                  <div className="card border shadow-none" key={block.key}>
                    <div className="card-header d-flex align-items-center gap-2 py-2">
                      <i className={`bi ${PALETTE.find((entry) => entry.type === block.type)?.icon ?? 'bi-square'} text-muted`} />
                      <span className="text-sm fw-semibold text-capitalize">{block.type.replace('_', ' ')}</span>
                      <div className="ms-auto d-flex align-items-center gap-1">
                        {block.type === 'poll' && post.polls[0] && (
                          <VotersButton pollId={post.polls[0].id} />
                        )}
                        <button type="button" className="btn btn-sm btn-neutral btn-square"
                          onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Move up">
                          <i className="bi bi-arrow-up" />
                        </button>
                        <button type="button" className="btn btn-sm btn-neutral btn-square"
                          onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label="Move down">
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
                        postId={post?.id}
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
                      <button key={entry.type} type="button" className="btn btn-sm btn-neutral rounded-pill"
                        onClick={() => addBlock(entry.type)}>
                        <i className={`bi ${entry.icon} me-1`} />
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {saved && !error && <div className="alert alert-success">Saved.</div>}

              <div className="d-flex flex-wrap gap-3 align-items-center">
                <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5"
                  disabled={updatePost.isPending}>
                  {updatePost.isPending ? 'Saving…' : 'Save changes'}
                </button>

                {post.can_delete && (
                  confirmingDelete ? (
                    <span className="d-flex align-items-center gap-2">
                      <span className="text-sm text-muted">Delete this post?</span>
                      <button type="button" className="btn btn-sm btn-danger rounded-pill" onClick={handleDelete}>
                        Confirm delete
                      </button>
                      <button type="button" className="btn btn-sm btn-link text-muted"
                        onClick={() => setConfirmingDelete(false)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="btn btn-link text-danger"
                      onClick={() => setConfirmingDelete(true)}>
                      Delete post
                    </button>
                  )
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function VotersButton({ pollId }: { pollId: number }) {
  const [open, setOpen] = useState(false);
  const { data: voters, isLoading } = usePollVoters(open ? pollId : undefined);

  return (
    <div className="position-relative">
      <button type="button" className="btn btn-sm btn-neutral rounded-pill"
        onClick={() => setOpen((current) => !current)}>
        <i className="bi bi-people me-1" />
        Voters
      </button>
      {open && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setOpen(false)} />
          <div className="modal fade show d-block" role="dialog" aria-modal="true" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header border-bottom py-2">
                  <span className="h6 mb-0">Who voted</span>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setOpen(false)} />
                </div>
                <div className="modal-body">
                  {isLoading && <p className="text-muted text-sm mb-0">Loading…</p>}
                  {voters && voters.length === 0 && (
                    <p className="text-muted text-sm mb-0">No votes yet.</p>
                  )}
                  {voters && voters.length > 0 && (
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Voter</th>
                          <th>Chose</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voters.map((vote, index) => (
                          <tr key={index}>
                            <td>
                              {vote.voter_name}
                              {!vote.is_registered && (
                                <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill ms-2 text-xs">
                                  guest
                                </span>
                              )}
                            </td>
                            <td>{vote.option_label}</td>
                            <td className="text-xs text-muted">
                              {new Date(vote.voted_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
