import { Link } from 'react-router-dom';

import {
  usePosts,
  useProjects,
  usePublicSettings,
  useServices,
  useSponsors,
  useTestimonials,
} from '@/api/hooks';
import { AdSlot } from '@/components/ads/AdSlot';
import { PostCard } from '@/components/blog/PostCard';
import { useContactModal } from '@/features/contact/ContactModalContext';

export function Home() {
  const { data: settings } = usePublicSettings();
  const { data: services } = useServices();
  const { data: projects } = useProjects(true);
  const { data: sponsors } = useSponsors();
  const { data: testimonials } = useTestimonials();
  const { data: posts } = usePosts({ perPage: 3, sort: 'recent' });
  const { open: openContact } = useContactModal();

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="cj-section cj-section--lg bg-surface-secondary">
        <div className="container">
          <div className="row align-items-center g-8">
            <div className="col-lg-6">
              {settings?.available_for_work && (
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill mb-4 px-3 py-2">
                  <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem' }} />
                  Available for new work
                </span>
              )}

              <h1 className="ls-tight font-bolder display-5 mb-4">
                {settings?.owner_name ?? 'Christopher James'}
                <span className="d-block text-primary">Full-stack engineer — AI &amp; SaaS, product engineering.</span>
              </h1>

              <p className="lead text-muted mb-6">
                Full-stack software engineer with 5+ years of experience building web
                platforms, SaaS products, internal business systems, and AI-integrated
                applications — end to end, from architecture to deployment.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3">
                <button
                  type="button"
                  className="btn btn-primary btn-lg rounded-pill px-5"
                  onClick={() => openContact('brief')}
                >
                  Start a project
                </button>
                <Link className="btn btn-neutral btn-lg rounded-pill px-5" to="/projects">
                  See the work
                </Link>
              </div>

              <div className="d-flex align-items-center gap-4 mt-6 text-sm text-muted">
                <a
                  className="text-muted text-decoration-none"
                  href="https://github.com/russiantech"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-github me-2" />
                  GitHub
                </a>
                <a
                  className="text-muted text-decoration-none"
                  href="https://www.linkedin.com/in/chrisjsm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-linkedin me-2" />
                  LinkedIn
                </a>
              </div>
            </div>

            <div className="col-lg-6">
              <img
                src="/assets/img/techa_hero.png"
                alt="Dashboard interface from one of the products"
                className="img-fluid rounded-4 shadow-4"
                loading="eager"
              />
            </div>
          </div>

          <div className="row g-4 mt-2 pt-6 border-top">
            {[
              { value: '5+', label: 'Years building production software' },
              { value: '9+', label: 'Platforms and products shipped' },
              { value: '4', label: 'Organisations engineered for' },
              { value: 'ALX', label: 'Full-Stack Software Engineering, certified' },
            ].map((stat) => (
              <div className="col-6 col-lg-3 cj-stat" key={stat.label}>
                <span className="cj-stat__value d-block">{stat.value}</span>
                <span className="cj-stat__label d-block">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ services */}
      <section className="cj-section cj-section--lg">
        <div className="container">
          <div className="row mb-8">
            <div className="col-lg-7">
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill mb-3">
                What I do
              </span>
              <h2 className="ls-tight font-bolder h1 mb-3">
                Four ways I tend to be useful
              </h2>
              <p className="text-muted lead mb-0">
                Most engagements start with one of these and grow from there.
              </p>
            </div>
          </div>

          <div className="row g-5">
            {services?.map((service) => (
              <div className="col-md-6 col-lg-3" key={service.id}>
                <div className="card border shadow-none h-100 cj-transition">
                  <div className="card-body">
                    <div
                      className={`icon icon-shape rounded-3 bg-${service.accent} bg-opacity-10 text-${service.accent} mb-4`}
                    >
                      <i className={`bi ${service.icon} fs-4`} />
                    </div>
                    <h3 className="h5 text-heading mb-2">{service.title}</h3>
                    <p className="text-sm text-muted mb-4">{service.summary}</p>
                    <ul className="list-unstyled text-sm d-flex flex-column gap-2 mb-0">
                      {service.bullets.slice(0, 3).map((bullet) => (
                        <li key={bullet} className="d-flex gap-2">
                          <i className={`bi bi-check-circle-fill text-${service.accent} mt-1`} />
                          <span className="text-muted">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- projects */}
      <section className="cj-section cj-section--lg bg-surface-secondary">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-8 gap-3">
            <div>
              <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill mb-3">
                Selected work
              </span>
              <h2 className="ls-tight font-bolder h1 mb-0">Things I have built</h2>
            </div>
            <Link className="btn btn-neutral rounded-pill" to="/projects">
              All projects
              <i className="bi bi-arrow-right ms-2" />
            </Link>
          </div>

          <div className="row g-5">
            {projects?.map((project) => (
              <div className="col-md-6 col-lg-4" key={project.id}>
                <Link to={`/projects/${project.slug}`} className="text-decoration-none">
                  <article className="card border shadow-none h-100 cj-transition">
                    {project.cover_url && (
                      <img
                        src={project.cover_url}
                        alt=""
                        loading="lazy"
                        className="card-img-top cj-cover"
                        style={{ aspectRatio: '16 / 10' }}
                      />
                    )}
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {project.icon && (
                          <i className={`bi ${project.icon} text-${project.accent}`} />
                        )}
                        <h3 className="h5 text-heading mb-0">{project.title}</h3>
                      </div>
                      <p className="text-sm text-muted mb-3">{project.tagline}</p>

                      {Object.keys(project.metrics).length > 0 && (
                        <div className="d-flex flex-wrap gap-4 mb-3">
                          {Object.entries(project.metrics).map(([label, value]) => (
                            <div key={label}>
                              <span className="d-block h6 mb-0 text-heading">{value}</span>
                              <span className="d-block text-xs text-muted text-capitalize">
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="d-flex flex-wrap gap-1">
                        {project.stack.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            className="badge bg-secondary bg-opacity-10 text-muted rounded-pill text-xs"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- sponsors */}
      {sponsors && sponsors.length > 0 && (
        <section className="py-8 border-bottom">
          <div className="container">
            <p className="text-center text-sm text-muted mb-5">
              Tools and teams I have worked alongside
            </p>
            <div className="row align-items-center justify-content-center g-5">
              {sponsors.map((sponsor) => (
                <div className="col-4 col-md-2 text-center" key={sponsor.id}>
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    loading="lazy"
                    className="img-fluid"
                    style={{ maxHeight: 28, opacity: sponsor.opacity }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- from the blog */}
      <section className="cj-section cj-section--lg">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-8 gap-3">
            <div>
              <span className="badge bg-info bg-opacity-10 text-info rounded-pill mb-3">
                Writing
              </span>
              <h2 className="ls-tight font-bolder h1 mb-0">From the blog</h2>
            </div>
            <Link className="btn btn-neutral rounded-pill" to="/blog">
              All posts
              <i className="bi bi-arrow-right ms-2" />
            </Link>
          </div>

          <div className="row g-5">
            {posts?.items.map((post) => (
              <div className="col-md-6 col-lg-4" key={post.id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>

          <AdSlot slotKey="feed_native" className="mt-8" />
        </div>
      </section>

      {/* --------------------------------------------------- testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="cj-section cj-section--lg bg-surface-secondary">
          <div className="container">
            <div className="row g-5">
              {testimonials.map((testimonial) => (
                <div className="col-md-6" key={testimonial.id}>
                  <figure className="card border shadow-none h-100">
                    <div className="card-body">
                      <div className="text-warning mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, index) => (
                          <i className="bi bi-star-fill" key={index} />
                        ))}
                      </div>
                      <blockquote className="mb-4">
                        <p className="text-heading mb-0">{testimonial.quote}</p>
                      </blockquote>
                      <figcaption className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-sm rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                          {testimonial.author_name.charAt(0)}
                        </div>
                        <div>
                          <span className="d-block text-sm fw-semibold text-heading">
                            {testimonial.author_name}
                          </span>
                          <span className="d-block text-xs text-muted">
                            {testimonial.author_title}
                            {testimonial.author_company && `, ${testimonial.author_company}`}
                          </span>
                        </div>
                      </figcaption>
                    </div>
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ cta */}
      <section className="cj-section cj-section--lg">
        <div className="container">
          <div className="card border-0 bg-primary text-white overflow-hidden">
            <div className="card-body p-6 p-lg-10 text-center">
              <h2 className="ls-tight font-bolder h1 text-white mb-3">
                Got something that needs building?
              </h2>
              <p className="lead text-white text-opacity-75 mb-6 mx-auto" style={{ maxWidth: 560 }}>
                Tell me what you are trying to do. If I am not the right person,
                I will say so and point you somewhere better.
              </p>
              <button
                type="button"
                className="btn btn-lg btn-white rounded-pill px-6"
                onClick={() => openContact('brief')}
              >
                Start the conversation
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
