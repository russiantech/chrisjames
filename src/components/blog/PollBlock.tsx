import { describeError } from '@/api/client';
import { useState } from 'react';

import { useRetractVote, useVote } from '@/api/hooks';
import type { Poll } from '@/api/types';

export function PollBlock({ poll, postSlug }: { poll: Poll; postSlug: string }) {
  const vote = useVote(postSlug);
  const retract = useRetractVote(postSlug);
  const [selected, setSelected] = useState<number[]>(poll.my_votes);

  const hasVoted = poll.my_votes.length > 0;
  const closed = !poll.is_open || (poll.closes_at !== null && new Date(poll.closes_at) < new Date());

  function toggle(optionId: number) {
    if (closed) return;
    setSelected((current) => {
      if (!poll.allow_multiple) return [optionId];
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      if (current.length >= poll.max_selections) return current;
      return [...current, optionId];
    });
  }

  return (
    <div className="my-6 p-4 p-md-5 rounded-3 border bg-surface-secondary">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-1">
        <h4 className="h5 mb-0">{poll.question}</h4>
        {closed && <span className="badge bg-secondary rounded-pill">Closed</span>}
      </div>
      {poll.description && <p className="text-sm text-muted mb-3">{poll.description}</p>}
      {poll.allow_multiple && (
        <p className="text-xs text-muted mb-3">
          Choose up to {poll.max_selections}.
        </p>
      )}

      <div className="d-flex flex-column gap-2 mb-3">
        {poll.options.map((option) => {
          const chosen = selected.includes(option.id);
          const mine = poll.my_votes.includes(option.id);
          const showBar = poll.results_visible;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              disabled={closed || vote.isPending}
              className={`position-relative text-start w-100 p-3 rounded-2 border bg-white ${
                chosen || mine ? 'border-primary' : ''
              }`}
              style={{ cursor: closed ? 'default' : 'pointer', overflow: 'hidden' }}
              aria-pressed={chosen}
            >
              {showBar && (
                <span
                  className={`position-absolute top-0 start-0 h-100 bg-${option.accent ?? 'primary'} bg-opacity-10`}
                  style={{ width: `${option.percentage}%`, transition: 'width 0.4s ease' }}
                  aria-hidden="true"
                />
              )}
              <span className="position-relative d-flex align-items-center gap-2">
                <i
                  className={`bi ${
                    poll.allow_multiple
                      ? chosen || mine
                        ? 'bi-check-square-fill text-primary'
                        : 'bi-square'
                      : chosen || mine
                        ? 'bi-record-circle-fill text-primary'
                        : 'bi-circle'
                  }`}
                />
                {option.icon && <i className={`bi ${option.icon} text-muted`} />}
                <span className="flex-grow-1 fw-medium">{option.label}</span>
                {showBar && (
                  <span className="text-sm text-muted fw-semibold">
                    {option.percentage}%
                    <span className="ms-2 fw-normal">({option.vote_count})</span>
                  </span>
                )}
                {mine && !showBar && <i className="bi bi-check-lg text-primary" />}
              </span>
              {option.description && (
                <span className="position-relative d-block text-sm text-muted mt-1 ms-4">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3">
        {!closed && (
          <button
            className="btn btn-sm btn-primary rounded-pill px-4"
            disabled={selected.length === 0 || vote.isPending}
            onClick={() => vote.mutate({ pollId: poll.id, optionIds: selected })}
          >
            {vote.isPending ? 'Sending…' : hasVoted ? 'Change vote' : 'Vote'}
          </button>
        )}
        {hasVoted && poll.allow_vote_change && !closed && (
          <button
            className="btn btn-sm btn-link text-muted p-0"
            onClick={() => {
              setSelected([]);
              retract.mutate(poll.id);
            }}
          >
            Clear my vote
          </button>
        )}
        <span className="text-sm text-muted ms-auto">
          {poll.results_visible
            ? `${poll.total_voters} ${poll.total_voters === 1 ? 'voter' : 'voters'}`
            : poll.hide_results_until_closed
              ? 'Results appear when the poll closes'
              : 'Vote to see the results'}
        </span>
      </div>

      {vote.isError && (
        <p className="text-sm text-danger mt-3 mb-0">{describeError(vote.error)}</p>
      )}
    </div>
  );
}
