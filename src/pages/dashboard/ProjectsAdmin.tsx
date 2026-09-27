import { useState } from 'react';

import { describeError } from '@/api/client';
import {
  useAdminProjects,
  useCreateProject,
  useDeleteProject,
  useReorderProjects,
  useUpdateProject,
} from '@/api/hooks';
import type { Project, ProjectInput } from '@/api/types';
import { MediaUploadButton } from '@/features/editor/MediaUploadButton';

const KINDS = ['product', 'client', 'open_source', 'experiment'];
const STATES = ['live', 'beta', 'archived', 'in_progress'];
const ACCENTS = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];

const BLANK: ProjectInput = {
  title: '',
  slug: '',
  tagline: '',
  summary: '',
  body: '',
  kind: 'product',
  role: '',
  client: '',
  stack: [],
  highlights: [],
  metrics: {},
  cover_url: '',
  gallery: [],
  icon: '',
  accent: 'primary',
  live_url: '',
  repo_url: '',
  case_study_url: '',
  started_on: '',
  ended_on: '',
  state: 'live',
  is_featured: false,
  is_published: true,
  position: 0,
};

function toFormState(project: Project): ProjectInput {
  return {
    title: project.title,
    slug: project.slug,
    tagline: project.tagline ?? '',
    summary: project.summary ?? '',
    body: project.body ?? '',
    kind: project.kind,
    role: project.role ?? '',
    client: project.client ?? '',
    stack: project.stack,
    highlights: project.highlights ?? [],
    metrics: project.metrics,
    cover_url: project.cover_url ?? '',
    gallery: project.gallery ?? [],
    icon: project.icon ?? '',
    accent: project.accent,
    live_url: project.live_url ?? '',
    repo_url: project.repo_url ?? '',
    case_study_url: project.case_study_url ?? '',
    started_on: project.started_on ?? '',
    ended_on: project.ended_on ?? '',
    state: project.state,
    is_featured: project.is_featured,
    is_published: project.is_published,
    position: project.position,
  };
}

/** "one per line" <-> string[] — used for stack and highlights alike. */
function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProjectsAdmin() {
  const { data: projects, isLoading } = useAdminProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const reorder = useReorderProjects();

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ProjectInput>(BLANK);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm(BLANK);
    setEditingId('new');
    setError(null);
  }

  function startEdit(project: Project) {
    setForm(toFormState(project));
    setEditingId(project.id);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setError(null);
    try {
      if (editingId === 'new') {
        await createProject.mutateAsync(form);
      } else if (editingId != null) {
        await updateProject.mutateAsync({ id: editingId, ...form });
      }
      setEditingId(null);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    try {
      await deleteProject.mutateAsync(project.id);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  function move(index: number, direction: -1 | 1) {
    if (!projects) return;
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const ids = projects.map((project) => project.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }

  const saving = createProject.isPending || updateProject.isPending;

  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h1 className="h3 mb-2">Projects</h1>
          <p className="text-muted mb-0">
            What shows on the Work page and the homepage's featured grid. Order here is the
            order visitors see.
          </p>
        </div>
        {editingId === null && (
          <button className="btn btn-primary rounded-pill" onClick={startCreate}>
            <i className="bi bi-plus-lg me-1" /> New project
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger mt-4">{error}</div>}

      {editingId !== null && (
        <div className="card border shadow-none my-5">
          <div className="card-body">
            <h2 className="h5 mb-4">{editingId === 'new' ? 'New project' : 'Edit project'}</h2>

            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label text-sm">Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-sm">Slug (blank = auto from title)</label>
                <input
                  className="form-control"
                  value={form.slug ?? ''}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-sm">Tagline</label>
                <input
                  className="form-control"
                  value={form.tagline ?? ''}
                  onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-sm">Summary</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.summary ?? ''}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-sm">Full case study (markdown, optional)</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.body ?? ''}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label text-sm">Kind</label>
                <select
                  className="form-select"
                  value={form.kind}
                  onChange={(event) => setForm({ ...form, kind: event.target.value })}
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-sm">State</label>
                <select
                  className="form-select"
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                >
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-sm">Role</label>
                <input
                  className="form-control"
                  value={form.role ?? ''}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-sm">Client (optional)</label>
                <input
                  className="form-control"
                  value={form.client ?? ''}
                  onChange={(event) => setForm({ ...form, client: event.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-sm">Stack — one per line</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.stack.join('\n')}
                  onChange={(event) => setForm({ ...form, stack: linesToList(event.target.value) })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-sm">Highlights — one per line</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.highlights.join('\n')}
                  onChange={(event) =>
                    setForm({ ...form, highlights: linesToList(event.target.value) })
                  }
                />
              </div>

              <div className="col-12">
                <hr />
                <label className="form-label text-sm d-block">Cover image</label>
                <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                  {form.cover_url && (
                    <img
                      src={form.cover_url}
                      alt=""
                      style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                  <input
                    className="form-control"
                    style={{ maxWidth: 420 }}
                    value={form.cover_url ?? ''}
                    onChange={(event) => setForm({ ...form, cover_url: event.target.value })}
                    placeholder="https://… or paste a link"
                  />
                </div>
                <MediaUploadButton
                  accept="image/*"
                  label="Cover"
                  folder="projects"
                  onUploaded={(media) => setForm((current) => ({ ...current, cover_url: media.url }))}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-sm d-block mt-3">Gallery</label>
                {form.gallery.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {form.gallery.map((url, index) => (
                      <div key={url} className="position-relative">
                        <img
                          src={url}
                          alt=""
                          style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger btn-square position-absolute top-0 end-0 rounded-circle"
                          style={{ transform: 'translate(30%, -30%)', width: 22, height: 22, padding: 0 }}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              gallery: current.gallery.filter((_, i) => i !== index),
                            }))
                          }
                          aria-label="Remove image"
                        >
                          <i className="bi bi-x" style={{ fontSize: '0.7rem' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <MediaUploadButton
                  accept="image/*"
                  label="Gallery image"
                  folder="projects"
                  onUploaded={(media) =>
                    setForm((current) => ({ ...current, gallery: [...current.gallery, media.url] }))
                  }
                />
                <hr />
              </div>

              <div className="col-md-6">
                <label className="form-label text-sm">Icon (Bootstrap icon class)</label>
                <input
                  className="form-control"
                  value={form.icon ?? ''}
                  onChange={(event) => setForm({ ...form, icon: event.target.value })}
                  placeholder="bi-rocket-takeoff"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-sm">Accent</label>
                <select
                  className="form-select"
                  value={form.accent}
                  onChange={(event) => setForm({ ...form, accent: event.target.value })}
                >
                  {ACCENTS.map((accent) => (
                    <option key={accent} value={accent}>
                      {accent}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label text-sm">Live URL</label>
                <input
                  className="form-control"
                  value={form.live_url ?? ''}
                  onChange={(event) => setForm({ ...form, live_url: event.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-sm">Repo URL (leave blank if private)</label>
                <input
                  className="form-control"
                  value={form.repo_url ?? ''}
                  onChange={(event) => setForm({ ...form, repo_url: event.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-sm">Case study URL</label>
                <input
                  className="form-control"
                  value={form.case_study_url ?? ''}
                  onChange={(event) => setForm({ ...form, case_study_url: event.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label text-sm">Started</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.started_on ?? ''}
                  onChange={(event) => setForm({ ...form, started_on: event.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-sm">Ended (blank = ongoing)</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.ended_on ?? ''}
                  onChange={(event) => setForm({ ...form, ended_on: event.target.value })}
                />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="proj-featured"
                    checked={form.is_featured}
                    onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                  />
                  <label className="form-check-label text-sm" htmlFor="proj-featured">
                    Featured on homepage
                  </label>
                </div>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="proj-published"
                    checked={form.is_published}
                    onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
                  />
                  <label className="form-check-label text-sm" htmlFor="proj-published">
                    Published
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-5">
              <button className="btn btn-primary rounded-pill px-4" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-link text-muted" onClick={cancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="text-muted">Loading…</p>}

      <div className="d-flex flex-column gap-3 mt-5">
        {projects?.map((project, index) => (
          <div className="card border shadow-none" key={project.id}>
            <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex flex-column">
                <button
                  className="btn btn-sm btn-neutral btn-square"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reorder.isPending}
                  aria-label="Move up"
                >
                  <i className="bi bi-chevron-up" />
                </button>
                <button
                  className="btn btn-sm btn-neutral btn-square mt-1"
                  onClick={() => move(index, 1)}
                  disabled={index === (projects?.length ?? 0) - 1 || reorder.isPending}
                  aria-label="Move down"
                >
                  <i className="bi bi-chevron-down" />
                </button>
              </div>

              {project.cover_url ? (
                <img
                  src={project.cover_url}
                  alt=""
                  style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-muted rounded-2"
                  style={{ width: 72, height: 48 }}
                >
                  <i className={`bi ${project.icon || 'bi-image'}`} />
                </div>
              )}

              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center gap-2">
                  <h2 className="h6 mb-0 text-truncate">{project.title}</h2>
                  {!project.is_published && (
                    <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill">
                      Draft
                    </span>
                  )}
                  {project.is_featured && (
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted mb-0 text-truncate">{project.tagline}</p>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-neutral rounded-pill" onClick={() => startEdit(project)}>
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-neutral rounded-pill text-danger"
                  onClick={() => remove(project)}
                  disabled={deleteProject.isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {projects && projects.length === 0 && (
          <p className="text-muted">No projects yet — add your first one above.</p>
        )}
      </div>
    </>
  );
}
