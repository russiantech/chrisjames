import { useRef, useState } from 'react';

import { describeError } from '@/api/client';
import { useUploadMedia } from '@/api/hooks';
import type { MediaAsset } from '@/api/types';

/**
 * The upload half of "upload a file directly, or attach one by link" —
 * the link half is just the existing plain URL <input> next to this.
 * Works for image/video/audio blocks alike; `accept` and `label` are the
 * only things that change per block type.
 */
export function MediaUploadButton({
  accept,
  label,
  postId,
  onUploaded,
}: {
  accept: string;
  label: string;
  postId?: number;
  onUploaded: (media: MediaAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    try {
      const result = await upload.mutateAsync({ file, postId });
      onUploaded(result.asset);
      if (result.deduplicated) setNotice('Already in your media library — reused it.');
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return (
    <div
      className={`d-flex align-items-center gap-2 flex-wrap rounded-3 px-2 py-1${
        dragging ? ' bg-primary bg-opacity-10' : ''
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="d-none"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <button
        type="button"
        className="btn btn-sm btn-neutral rounded-pill"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        <i className="bi bi-upload me-1" />
        {upload.isPending ? 'Uploading…' : `Upload ${label.toLowerCase()} file`}
      </button>
      <span className="text-xs text-muted">or drop a file here — or paste a link above</span>
      {notice && <span className="text-xs text-info">{notice}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
