import { useEffect, useRef } from 'react';

import type { ContentBlock, Poll } from '@/api/types';
import { AdSlot } from '@/components/ads/AdSlot';

import { PollBlock } from './PollBlock';

interface Props {
  blocks: ContentBlock[];
  polls: Poll[];
  postSlug: string;
}

export function BlockRenderer({ blocks, polls, postSlug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // The copy button lives inside server-rendered HTML, so it is wired up with
  // one delegated listener rather than by hydrating each block.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function onClick(event: MouseEvent) {
      const button = (event.target as HTMLElement).closest<HTMLElement>('[data-copy]');
      if (!button) return;

      const code = button.closest('.cj-code')?.querySelector('pre');
      if (!code) return;

      void navigator.clipboard.writeText(code.textContent ?? '').then(() => {
        button.textContent = 'Copied';
        button.setAttribute('data-copied', '');
        window.setTimeout(() => {
          button.textContent = 'Copy';
          button.removeAttribute('data-copied');
        }, 1600);
      });
    }

    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, [blocks]);

  return (
    <div className="cj-prose" ref={containerRef}>
      {blocks
        .filter((block) => !block.is_hidden)
        .map((block) => (
          <Block key={block.id} block={block} polls={polls} postSlug={postSlug} />
        ))}
    </div>
  );
}

function Block({
  block,
  polls,
  postSlug,
}: {
  block: ContentBlock;
  polls: Poll[];
  postSlug: string;
}) {
  const { type, data, settings, anchor } = block;

  switch (type) {
    // All of these arrive as HTML that the API already sanitised and
    // highlighted, so rendering is a straight insert.
    case 'rich_text':
    case 'markdown':
    case 'html':
    case 'code':
      return <div dangerouslySetInnerHTML={{ __html: data.html ?? '' }} />;

    case 'heading': {
      const level = Math.min(Math.max(Number(data.level) || 2, 2), 6);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <Tag id={anchor ?? undefined} className="scroll-mt-5">
          {data.text}
        </Tag>
      );
    }

    case 'quote':
      return (
        <figure className="my-5">
          <blockquote className="mb-2">{data.text}</blockquote>
          {(data.author || data.source) && (
            <figcaption className="text-sm text-muted">
              — {data.author}
              {data.source && <cite className="ms-1">, {data.source}</cite>}
            </figcaption>
          )}
        </figure>
      );

    case 'callout': {
      const tones: Record<string, string> = {
        info: 'primary',
        tip: 'success',
        warning: 'warning',
        danger: 'danger',
        note: 'secondary',
      };
      const accent = tones[data.tone as string] ?? 'primary';
      return (
        <aside
          className={`d-flex gap-3 p-4 my-5 rounded-3 bg-${accent} bg-opacity-10 border-start border-4 border-${accent}`}
        >
          <i className={`bi ${data.icon ?? 'bi-info-circle'} text-${accent} fs-5 mt-1`} />
          <div className="flex-grow-1" dangerouslySetInnerHTML={{ __html: data.html ?? '' }} />
        </aside>
      );
    }

    case 'list': {
      const items: string[] = data.items ?? [];
      const Tag = data.ordered ? 'ol' : 'ul';
      return (
        <Tag className={data.style === 'check' ? 'list-unstyled' : undefined}>
          {items.map((item, index) => (
            <li key={index} className={data.style === 'check' ? 'd-flex gap-2 mb-2' : undefined}>
              {data.style === 'check' && <i className="bi bi-check-circle-fill text-success mt-1" />}
              <span>{item}</span>
            </li>
          ))}
        </Tag>
      );
    }

    case 'table': {
      const rows: string[][] = data.rows ?? [];
      const headers: string[] = data.headers ?? [];
      return (
        <figure className="my-5">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              {headers.length > 0 && (
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
          )}
        </figure>
      );
    }

    case 'image':
      return (
        <figure className={`my-5 ${settings.full_width ? 'mx-n4' : ''}`}>
          <img
            src={data.url}
            alt={data.alt ?? ''}
            width={data.width || undefined}
            height={data.height || undefined}
            loading="lazy"
            className="img-fluid rounded-3"
          />
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2 text-center">{data.caption}</figcaption>
          )}
        </figure>
      );

    case 'gallery': {
      const images: { url: string; alt?: string; caption?: string }[] = data.images ?? [];
      const columns = Math.min(Math.max(Number(data.columns) || 3, 1), 4);
      return (
        <figure className="my-5">
          <div className={`row g-3 row-cols-1 row-cols-md-${columns}`}>
            {images.map((image, index) => (
              <div className="col" key={index}>
                <img
                  src={image.url}
                  alt={image.alt ?? ''}
                  loading="lazy"
                  className="img-fluid rounded-3 cj-cover"
                  style={{ aspectRatio: '4 / 3' }}
                />
              </div>
            ))}
          </div>
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
          )}
        </figure>
      );
    }

    case 'video': {
      // A hosted file plays natively; anything else is an allowlisted embed.
      if (data.provider === 'upload' || (data.url ?? '').match(/\.(mp4|webm|ogg)$/i)) {
        return (
          <figure className="my-5">
            <video
              className="w-100 rounded-3"
              controls
              preload="metadata"
              poster={data.poster_url || undefined}
            >
              <source src={data.url} />
              Your browser cannot play this video.
            </video>
            {data.caption && (
              <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="my-5">
          <div className="ratio ratio-16x9 rounded-3 overflow-hidden">
            <iframe
              src={data.embed_url ?? data.url}
              title={data.caption ?? 'Embedded video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
          )}
        </figure>
      );
    }

    case 'audio':
      return (
        <figure className="my-5 p-4 rounded-3 bg-surface-secondary border">
          {data.title && <h4 className="h6 mb-1">{data.title}</h4>}
          {data.artist && <p className="text-sm text-muted mb-3">{data.artist}</p>}
          <audio className="w-100" controls preload="metadata" src={data.url}>
            Your browser cannot play this audio.
          </audio>
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
          )}
        </figure>
      );

    case 'file':
      return (
        <a
          href={data.url}
          className="d-flex align-items-center gap-3 p-3 my-4 rounded-3 border text-decoration-none text-heading"
          download
        >
          <i className="bi bi-file-earmark-arrow-down fs-3 text-primary" />
          <span className="flex-grow-1">
            <span className="d-block fw-semibold">{data.filename ?? 'Download'}</span>
            {data.size_label && <span className="d-block text-sm text-muted">{data.size_label}</span>}
          </span>
          <i className="bi bi-download text-muted" />
        </a>
      );

    case 'embed':
      return (
        <figure className="my-5">
          <div className={`ratio ratio-${data.aspect ?? '16x9'} rounded-3 overflow-hidden`}>
            <iframe
              src={data.embed_url}
              title={data.caption ?? 'Embedded content'}
              loading="lazy"
              allowFullScreen
            />
          </div>
          {data.caption && (
            <figcaption className="text-sm text-muted mt-2">{data.caption}</figcaption>
          )}
        </figure>
      );

    case 'poll': {
      const poll = polls.find((candidate) => candidate.id === data.poll_id);
      if (!poll) return null;
      return <PollBlock poll={poll} postSlug={postSlug} />;
    }

    case 'quiz': {
      const questions: { prompt: string; options: string[]; answer_index: number }[] =
        data.questions ?? [];
      return (
        <div className="my-5 p-4 rounded-3 border bg-surface-secondary">
          <h4 className="h6 mb-3">
            <i className="bi bi-patch-question me-2 text-primary" />
            {data.title ?? 'Check yourself'}
          </h4>
          {questions.map((question, index) => (
            <details key={index} className="mb-3">
              <summary className="fw-semibold" style={{ cursor: 'pointer' }}>
                {question.prompt}
              </summary>
              <ul className="mt-2 mb-0">
                {question.options.map((option, optionIndex) => (
                  <li
                    key={optionIndex}
                    className={optionIndex === question.answer_index ? 'text-success fw-semibold' : ''}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      );
    }

    case 'divider':
      return <hr className="my-6" />;

    case 'button':
      return (
        <p className="my-5">
          <a
            href={data.url}
            className={`btn btn-${data.variant ?? 'primary'} rounded-pill px-4`}
            target={data.new_tab ? '_blank' : undefined}
            rel={data.new_tab ? 'noreferrer' : undefined}
          >
            {data.icon && <i className={`bi ${data.icon} me-2`} />}
            {data.label}
          </a>
        </p>
      );

    case 'ad_slot':
      return <AdSlot slotKey={data.slot_key} className="my-6" />;

    case 'math':
      // Rendered as-is; wire up KaTeX here if formulas become common.
      return (
        <div className="my-4 text-center font-monospace text-sm p-3 bg-surface-secondary rounded-3">
          {data.latex}
        </div>
      );

    default:
      return null;
  }
}
