import { describeError } from '@/api/client';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useModerateComment,
  usePublicSettings,
} from '@/api/hooks';
import type { Comment } from '@/api/types';
import { useAuth } from '@/features/auth/AuthContext';

function timeAgo(value: string): string {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'],
    [604800, 'day'], [2592000, 'week'], [31536000, 'month'],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  let previous = 1;
  for (const [limit, unit] of units) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / previous), unit);
    previous = limit;
  }
  return formatter.format(-Math.floor(seconds / 31536000), 'year');
}

export function Comments({ postId, allowed }: { postId: number; allowed: boolean }) {
  const { data: comments, isLoading } = useComments(postId);
  const { data: settings } = usePublicSettings();
  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState<number | null>(null);

  if (!allowed) {
    return (
      <p className="text-muted text-sm border-top pt-5">Comments are closed on this post.</p>
    );
  }

  const total = comments?.length ?? 0;

  return (
    <section className="border-top pt-6 mt-6" id="comments">
      <h2 className="h4 mb-4">
        {total === 0 ? 'No comments yet' : `${total} ${total === 1 ? 'comment' : 'comments'}`}
      </h2>

      {!user && settings?.comments_require_login ? (
        <p className="text-muted">
          <Link to="/login">Sign in</Link> to join the conversation.
        </p>
      ) : (
        <CommentForm postId={postId} onDone={() => setReplyTo(null)} />
      )}

      {isLoading && <p className="text-muted text-sm mt-4">Loading comments…</p>}

      <div className="mt-5 d-flex flex-column gap-4">
        {comments?.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            postId={postId}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        ))}
      </div>
    </section>
  );
}

function CommentNode({
  comment,
  postId,
  replyTo,
  setReplyTo,
}: {
  comment: Comment;
  postId: number;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
}) {
  const remove = useDeleteComment(postId);
  const moderate = useModerateComment();
  const pending = comment.moderation_state !== 'approved';

  return (
    <article
      id={`comment-${comment.id}`}
      className={comment.depth > 0 ? 'ms-4 ms-md-5 ps-3 border-start' : ''}
    >
      <div className={`d-flex gap-3 ${pending ? 'opacity-75' : ''}`}>
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt=""
            className="avatar avatar-sm rounded-circle flex-shrink-0"
          />
        ) : (
          <div className="avatar avatar-sm rounded-circle bg-primary bg-opacity-10 text-primary flex-shrink-0 d-flex align-items-center justify-content-center">
            {comment.display_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-grow-1 min-w-0">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span className="fw-semibold text-heading text-sm">{comment.display_name}</span>
            {comment.is_author_reply && (
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill text-xs">
                Author
              </span>
            )}
            {comment.is_pinned && <i className="bi bi-pin-angle-fill text-warning" title="Pinned" />}
            <time className="text-xs text-muted" dateTime={comment.created_at}>
              {timeAgo(comment.created_at)}
            </time>
            {comment.is_edited && <span className="text-xs text-muted">(edited)</span>}
            {pending && (
              <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill text-xs text-capitalize">
                {comment.moderation_state}
              </span>
            )}
          </div>

          <div
            className="text-sm cj-prose"
            style={{ fontSize: '0.95rem', lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: comment.body_html }}
          />

          <div className="d-flex align-items-center gap-3 mt-2">
            {comment.depth < 6 && (
              <button
                className="btn btn-sm btn-link p-0 text-muted text-xs"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <i className="bi bi-reply me-1" />
                Reply
              </button>
            )}
            {comment.can_delete && (
              <button
                className="btn btn-sm btn-link p-0 text-danger text-xs"
                onClick={() => remove.mutate(comment.id)}
              >
                Delete
              </button>
            )}
            {comment.can_moderate && pending && (
              <button
                className="btn btn-sm btn-link p-0 text-success text-xs"
                onClick={() => moderate.mutate({ id: comment.id, state: 'approved' })}
              >
                Approve
              </button>
            )}
            {comment.can_moderate && !pending && (
              <button
                className="btn btn-sm btn-link p-0 text-warning text-xs"
                onClick={() => moderate.mutate({ id: comment.id, state: 'hidden' })}
              >
                Hide
              </button>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onDone={() => setReplyTo(null)}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-4 d-flex flex-column gap-4">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function CommentForm({
  postId,
  parentId,
  onDone,
  compact = false,
}: {
  postId: number;
  parentId?: number;
  onDone?: () => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const create = useCreateComment(postId);
  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    create.mutate(
      {
        body: body.trim(),
        parent_id: parentId ?? null,
        guest_name: user ? undefined : guestName,
        guest_email: user ? undefined : guestEmail,
        website_url: honeypot,
      },
      {
        onSuccess: () => {
          setBody('');
          onDone?.();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? '' : 'p-4 rounded-3 bg-surface-secondary'}>
      {!user && (
        <div className="row g-2 mb-2">
          <div className="col-sm-6">
            <input
              className="form-control form-control-sm"
              placeholder="Your name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              required
              aria-label="Your name"
            />
          </div>
          <div className="col-sm-6">
            <input
              type="email"
              className="form-control form-control-sm"
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              required
              aria-label="Your e-mail"
            />
          </div>
        </div>
      )}

      <textarea
        className="form-control"
        rows={compact ? 2 : 3}
        placeholder={parentId ? 'Write a reply…' : 'Markdown is supported. Be kind.'}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        required
        aria-label="Your comment"
      />

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <input
        type="text"
        name="website_url"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      <div className="d-flex align-items-center gap-3 mt-2">
        <button
          type="submit"
          className="btn btn-sm btn-primary rounded-pill px-4"
          disabled={create.isPending || !body.trim()}
        >
          {create.isPending ? 'Posting…' : parentId ? 'Reply' : 'Post comment'}
        </button>
        {parentId && (
          <button type="button" className="btn btn-sm btn-link text-muted" onClick={onDone}>
            Cancel
          </button>
        )}
        {create.isError && (
          <span className="text-sm text-danger">{describeError(create.error)}</span>
        )}
      </div>
    </form>
  );
}
