import type { BlockType } from '@/api/types';

import { MediaUploadButton } from './MediaUploadButton';

export interface DraftBlock {
  key: string;
  type: BlockType;
  data: Record<string, any>;
}

/** The subset of block types the composer offers. The API accepts all 21. */
export const PALETTE: { type: BlockType; label: string; icon: string; blank: Record<string, any> }[] = [
  { type: 'markdown', label: 'Text', icon: 'bi-text-paragraph', blank: { source: '' } },
  { type: 'heading', label: 'Heading', icon: 'bi-type-h2', blank: { text: '', level: 2 } },
  { type: 'code', label: 'Code', icon: 'bi-code-slash', blank: { source: '', language: 'python', filename: '' } },
  { type: 'quote', label: 'Quote', icon: 'bi-quote', blank: { text: '', author: '' } },
  { type: 'image', label: 'Image', icon: 'bi-image', blank: { url: '', alt: '', caption: '' } },
  { type: 'video', label: 'Video', icon: 'bi-camera-video', blank: { url: '', embed_url: '', caption: '' } },
  { type: 'audio', label: 'Audio', icon: 'bi-music-note-beamed', blank: { url: '', title: '' } },
  { type: 'embed', label: 'Embed', icon: 'bi-window-plus', blank: { embed_url: '', caption: '' } },
  { type: 'callout', label: 'Callout', icon: 'bi-info-circle', blank: { html: '', tone: 'info' } },
  { type: 'list', label: 'List', icon: 'bi-list-ul', blank: { items: [''], ordered: false } },
  { type: 'poll', label: 'Poll', icon: 'bi-bar-chart', blank: {} },
  { type: 'divider', label: 'Divider', icon: 'bi-hr', blank: {} },
];

let counter = 0;
export const nextKey = () => `block-${++counter}`;

export function BlockEditor({
  block,
  onChange,
  poll,
  setPoll,
  postId,
}: {
  block: DraftBlock;
  onChange: (patch: Record<string, any>) => void;
  poll: { question: string; options: string[] };
  setPoll: (value: { question: string; options: string[] }) => void;
  /** Existing post's id, if any — tags uploads so the library shows what's in use. */
  postId?: number;
}) {
  switch (block.type) {
    case 'markdown':
      return (
        <>
          <textarea className="form-control" rows={6} value={block.data.source}
            onChange={(event) => onChange({ source: event.target.value })}
            placeholder="Markdown. **Bold**, `code`, - lists, > quotes." />
          <div className="form-text">Markdown, including fenced code blocks.</div>
        </>
      );

    case 'heading':
      return (
        <div className="d-flex gap-2">
          <select className="form-select w-auto" value={block.data.level}
            onChange={(event) => onChange({ level: Number(event.target.value) })}>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
          <input className="form-control" value={block.data.text}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="Heading text" />
        </div>
      );

    case 'code':
      return (
        <>
          <div className="row g-2 mb-2">
            <div className="col-sm-6">
              <input className="form-control form-control-sm" value={block.data.language}
                onChange={(event) => onChange({ language: event.target.value })}
                placeholder="python" aria-label="Language" />
            </div>
            <div className="col-sm-6">
              <input className="form-control form-control-sm" value={block.data.filename}
                onChange={(event) => onChange({ filename: event.target.value })}
                placeholder="filename (optional)" aria-label="Filename" />
            </div>
          </div>
          <textarea className="form-control font-monospace" rows={8} value={block.data.source}
            onChange={(event) => onChange({ source: event.target.value })}
            spellCheck={false} placeholder="Paste your code" />
          <div className="form-text">Highlighted server-side when you submit.</div>
        </>
      );

    case 'quote':
      return (
        <>
          <textarea className="form-control mb-2" rows={3} value={block.data.text}
            onChange={(event) => onChange({ text: event.target.value })} placeholder="The quote" />
          <input className="form-control" value={block.data.author}
            onChange={(event) => onChange({ author: event.target.value })}
            placeholder="Who said it (optional)" />
        </>
      );

    case 'image':
      return (
        <>
          <input className="form-control mb-2" value={block.data.url}
            onChange={(event) => onChange({ url: event.target.value })}
            placeholder="https://… or /media/…" required />
          <MediaUploadButton accept="image/*" label="Image" postId={postId} folder="posts"
            onUploaded={(media) => onChange({ url: media.url, media_id: media.id })} />
          <input className="form-control mt-2 mb-2" value={block.data.alt}
            onChange={(event) => onChange({ alt: event.target.value })}
            placeholder="Alt text — describe it for screen readers" />
          <input className="form-control" value={block.data.caption}
            onChange={(event) => onChange({ caption: event.target.value })}
            placeholder="Caption (optional)" />
        </>
      );

    case 'video':
      return (
        <>
          <input className="form-control mb-2" value={block.data.url}
            onChange={(event) => onChange({ url: event.target.value, embed_url: event.target.value })}
            placeholder="File URL, or a YouTube/Vimeo embed URL" />
          <MediaUploadButton accept="video/*" label="Video" postId={postId} folder="posts"
            onUploaded={(media) => onChange({ url: media.url, embed_url: media.url, media_id: media.id })} />
          <input className="form-control mt-2" value={block.data.caption}
            onChange={(event) => onChange({ caption: event.target.value })}
            placeholder="Caption (optional)" />
          <div className="form-text">Embeds are limited to a list of known hosts.</div>
        </>
      );

    case 'audio':
      return (
        <>
          <input className="form-control mb-2" value={block.data.url}
            onChange={(event) => onChange({ url: event.target.value })}
            placeholder="Audio file URL" required />
          <MediaUploadButton accept="audio/*" label="Audio" postId={postId} folder="posts"
            onUploaded={(media) => onChange({ url: media.url, media_id: media.id })} />
          <input className="form-control mt-2" value={block.data.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Title (optional)" />
        </>
      );

    case 'embed':
      return (
        <input className="form-control" value={block.data.embed_url}
          onChange={(event) => onChange({ embed_url: event.target.value })}
          placeholder="CodePen, Figma, Spotify, Loom…" required />
      );

    case 'callout':
      return (
        <>
          <select className="form-select mb-2" value={block.data.tone}
            onChange={(event) => onChange({ tone: event.target.value })}>
            <option value="info">Info</option>
            <option value="tip">Tip</option>
            <option value="warning">Warning</option>
            <option value="danger">Careful</option>
          </select>
          <textarea className="form-control" rows={3} value={block.data.html}
            onChange={(event) => onChange({ html: event.target.value })}
            placeholder="The point you want to stand out" />
        </>
      );

    case 'list': {
      const items: string[] = block.data.items ?? [''];
      return (
        <>
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id={`ordered-${block.key}`}
              checked={Boolean(block.data.ordered)}
              onChange={(event) => onChange({ ordered: event.target.checked })} />
            <label className="form-check-label text-sm" htmlFor={`ordered-${block.key}`}>
              Numbered
            </label>
          </div>
          {items.map((item, index) => (
            <div className="input-group mb-2" key={index}>
              <input className="form-control" value={item}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = event.target.value;
                  onChange({ items: next });
                }}
                placeholder={`Item ${index + 1}`} />
              <button type="button" className="btn btn-neutral"
                onClick={() => onChange({ items: items.filter((_, i) => i !== index) })}
                aria-label="Remove item">
                <i className="bi bi-x" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-neutral rounded-pill"
            onClick={() => onChange({ items: [...items, ''] })}>
            Add item
          </button>
        </>
      );
    }

    case 'poll':
      return (
        <>
          <input className="form-control mb-3" value={poll.question}
            onChange={(event) => setPoll({ ...poll, question: event.target.value })}
            placeholder="What do you want to ask?" />
          {poll.options.map((option, index) => (
            <div className="input-group mb-2" key={index}>
              <input className="form-control" value={option}
                onChange={(event) => {
                  const next = [...poll.options];
                  next[index] = event.target.value;
                  setPoll({ ...poll, options: next });
                }}
                placeholder={`Option ${index + 1}`} />
              {poll.options.length > 2 && (
                <button type="button" className="btn btn-neutral"
                  onClick={() =>
                    setPoll({ ...poll, options: poll.options.filter((_, i) => i !== index) })
                  }
                  aria-label="Remove option">
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-neutral rounded-pill"
            onClick={() => setPoll({ ...poll, options: [...poll.options, ''] })}>
            Add option
          </button>
        </>
      );

    case 'divider':
      return <p className="text-sm text-muted mb-0">A horizontal rule. Nothing to configure.</p>;

    default:
      return null;
  }
}
