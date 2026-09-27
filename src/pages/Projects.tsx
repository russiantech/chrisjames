import { Link, useParams } from 'react-router-dom';

import { useProject, useProjects } from '@/api/hooks';
import type { Project } from '@/api/types';

export function Projects() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="cj-section">
      <div className="container">
        <header className="mb-8">
          <span className="cj-eyebrow mb-3">Portfolio</span>
          <h1 className="ls-tight font-bolder display-6 mb-3">Featured Projects</h1>
          <p className="lead text-muted mb-2">
            Production-grade platforms built across e-commerce, ed-tech, fintech, and
            vertical SaaS.
          </p>
          <p className="text-muted text-sm mb-0">
            <i className="bi bi-lock-fill me-1" />
            Most of these are commercial products — code lives in private or
            company-owned repositories rather than my public GitHub.
          </p>
        </header>

        {isLoading && <p className="text-muted">Loading…</p>}

        <div>
          {projects?.map((project, index) => (
            <ProjectRow project={project} reversed={index % 2 === 1} key={project.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ project, reversed }: { project: Project; reversed: boolean }) {
  return (
    <article className="cj-project-row">
      <div className={`row align-items-center g-6${reversed ? ' flex-lg-row-reverse' : ''}`}>
        <div className="col-lg-6">
          <Link to={`/projects/${project.slug}`} className="d-block cj-transition">
            <div className="cj-project-row__media">
              {project.cover_url ? (
                <img src={project.cover_url} alt="" loading="lazy" />
              ) : (
                <div className="cj-project-row__media--empty">
                  <i className={`bi ${project.icon || 'bi-window'}`} />
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="col-lg-6">
          <div className="d-flex align-items-center gap-2 mb-2">
            <h2 className="h3 text-heading mb-0">{project.title}</h2>
            {project.role && (
              <span className={`badge bg-${project.accent} bg-opacity-10 text-${project.accent} rounded-pill`}>
                {project.role}
              </span>
            )}
          </div>

          {project.summary && <p className="text-muted mb-4">{project.summary}</p>}

          {project.highlights && project.highlights.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs text-uppercase text-muted fw-semibold mb-2">
                Key Features
              </h3>
              <ul className="cj-project-row__features">
                {project.highlights.map((feature) => (
                  <li key={feature}>
                    <i className="bi bi-check-circle-fill" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="d-flex flex-wrap gap-1 mb-4">
            {project.stack.map((item) => (
              <span
                key={item}
                className="badge bg-secondary bg-opacity-10 text-muted rounded-pill text-xs"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="d-flex flex-wrap gap-3">
            {project.live_url && (
              <a
                className="btn btn-sm btn-primary rounded-pill px-4"
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
              >
                Live Site
                <i className="bi bi-arrow-up-right ms-2" />
              </a>
            )}
            {project.repo_url ? (
              <a
                className="btn btn-sm btn-neutral rounded-pill px-4"
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
              >
                <i className="bi bi-github me-2" />
                Source
              </a>
            ) : (
              <span
                className="d-inline-flex align-items-center gap-2 text-muted text-sm"
                title="Code lives in a private/company repository — not publicly browsable"
              >
                <i className="bi bi-lock-fill" />
                Private repository
              </span>
            )}
            <Link className="btn btn-sm btn-link px-0" to={`/projects/${project.slug}`}>
              Full details
              <i className="bi bi-arrow-right ms-2" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProjectDetail() {
  const { slug = '' } = useParams();
  const { data: project, isLoading } = useProject(slug);

  if (isLoading) return <div className="container py-10 text-muted">Loading…</div>;

  if (!project) {
    return (
      <div className="container py-10 text-center">
        <h1 className="h3">That project is not here</h1>
        <Link className="btn btn-primary rounded-pill mt-3" to="/projects">
          All projects
        </Link>
      </div>
    );
  }

  return (
    <div className="cj-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <Link className="text-sm text-muted text-decoration-none" to="/projects">
              <i className="bi bi-arrow-left me-1" />
              All projects
            </Link>

            <header className="my-5">
              <div className="d-flex align-items-center gap-3 mb-3">
                {project.icon && (
                  <div
                    className={`icon icon-shape rounded-3 bg-${project.accent} bg-opacity-10 text-${project.accent}`}
                  >
                    <i className={`bi ${project.icon} fs-4`} />
                  </div>
                )}
                <div>
                  <h1 className="ls-tight font-bolder display-6 mb-1">{project.title}</h1>
                  <p className="lead text-muted mb-0">{project.tagline}</p>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 mt-4">
                {project.live_url && (
                  <a
                    className="btn btn-primary rounded-pill px-4"
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="bi bi-box-arrow-up-right me-2" />
                    Visit the site
                  </a>
                )}
                {project.repo_url ? (
                  <a
                    className="btn btn-neutral rounded-pill px-4"
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="bi bi-github me-2" />
                    Source
                  </a>
                ) : (
                  <span
                    className="d-inline-flex align-items-center gap-2 text-muted"
                    title="Code lives in a private/company repository — not publicly browsable"
                  >
                    <i className="bi bi-lock-fill" />
                    Private repository
                  </span>
                )}
              </div>
            </header>

            {project.cover_url && (
              <img src={project.cover_url} alt="" className="img-fluid rounded-4 mb-6 w-100" />
            )}

            {Object.keys(project.metrics).length > 0 && (
              <div className="row g-4 mb-6">
                {Object.entries(project.metrics).map(([label, value]) => (
                  <div className="col-4" key={label}>
                    <div className="card border shadow-none text-center">
                      <div className="card-body py-4">
                        <span className="d-block h3 mb-1 text-heading">{value}</span>
                        <span className="d-block text-xs text-muted text-uppercase">{label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cj-prose mb-6">
              <p>{project.summary}</p>
              {project.body && <p>{project.body}</p>}
            </div>

            {project.highlights && project.highlights.length > 0 && (
              <>
                <h2 className="h4 mb-3">Key Features</h2>
                <ul className="cj-prose mb-6">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="row g-4 border-top pt-5">
              <div className="col-sm-4">
                <h3 className="text-xs text-uppercase text-muted mb-2">Role</h3>
                <p className="mb-0">{project.role ?? '—'}</p>
              </div>
              <div className="col-sm-8">
                <h3 className="text-xs text-uppercase text-muted mb-2">Built with</h3>
                <div className="d-flex flex-wrap gap-1">
                  {project.stack.map((item) => (
                    <span
                      key={item}
                      className="badge bg-secondary bg-opacity-10 text-muted rounded-pill"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
