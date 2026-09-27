import { useExperience, useSkills } from '@/api/hooks';
import type { Experience as ExperienceRow } from '@/api/types';

function formatRange(started: string, ended: string | null, current: boolean): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
  const from = new Date(started).toLocaleDateString(undefined, options);
  const to = current ? 'Present' : ended ? new Date(ended).toLocaleDateString(undefined, options) : '';
  return `${from} — ${to}`;
}

const STATS = [
  { value: '5+', label: 'Years building production software' },
  { value: '9+', label: 'Platforms and products shipped' },
  { value: '4', label: 'Organisations engineered for' },
  { value: 'ALX', label: 'Full-Stack Software Engineering, certified' },
];

const VALUES = [
  {
    icon: 'bi-rocket',
    title: 'What I focus on',
    body:
      "Empowering small and medium businesses to thrive by building smart, accessible " +
      "tools — the kind that hold up once real people and real money depend on them.",
  },
  {
    icon: 'bi-eye',
    title: 'How I work',
    body:
      "I aim to be the engineer a team can hand a hard problem to and not think about " +
      "again — scoped clearly, built properly, and handed back with nothing left dangling.",
  },
];

export function About() {
  const { data: experience } = useExperience();
  const { data: skills } = useSkills();

  // Education entries live in the same table with employment_type
  // "education" — reusing it avoided a whole extra model for one more list.
  const workHistory = experience?.filter((role) => role.employment_type !== 'education') ?? [];
  const education = experience?.filter((role) => role.employment_type === 'education') ?? [];

  return (
    <div>
      {/* -------------------------------------------------------- intro */}
      <section className="cj-section cj-section--lg bg-surface-secondary">
        <div className="container">
          <div className="row align-items-center g-8">
            <div className="col-lg-6 order-lg-1">
              <span className="cj-eyebrow mb-3">Who I am</span>
              <h1 className="ls-tight font-bolder display-6 mb-4">
                Full-stack software engineer — AI &amp; SaaS, product engineering.
              </h1>
              <p className="text-heading fw-medium lh-lg mb-3">
                Full-stack software engineer with 5+ years of experience building web
                platforms, SaaS products, internal business systems, and AI-integrated
                applications. Experienced across the full product lifecycle, from system
                architecture and API design to frontend development, deployment,
                integrations, and ongoing optimisation. I lead engineering initiatives,
                develop commercial software products, and build solutions across
                e-commerce, education, workforce management, and vertical SaaS.
              </p>
              <p className="text-muted mb-0">
                Based in Lagos, Nigeria, working with teams anywhere.
              </p>
            </div>

            <div className="col-lg-6 order-lg-2">
              <div className="cj-portrait mx-auto mx-lg-0">
                <img
                  src="/assets/img/profile.jpg"
                  alt="Christopher James"
                  className="cj-portrait__img"
                  loading="eager"
                  onError={(event) => {
                    // Falls back to an initials card until a real photo is
                    // dropped in at public/assets/img/profile.jpg.
                    event.currentTarget.style.display = 'none';
                    event.currentTarget.parentElement?.classList.add('cj-portrait--fallback');
                  }}
                />
                <div className="cj-portrait__fallback">
                  <span>CJ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-2 pt-6 border-top">
            {STATS.map((stat) => (
              <div className="col-6 col-lg-3 cj-stat" key={stat.label}>
                <span className="cj-stat__value d-block">{stat.value}</span>
                <span className="cj-stat__label d-block">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- mission/vision */}
      <section className="cj-section">
        <div className="container">
          <div className="row g-8">
            <div className="col-lg-5">
              <span className="cj-eyebrow mb-3">Mission &amp; vision</span>
              <h2 className="h3 font-bolder mb-0">
                Technology that makes lives easier and businesses more profitable.
              </h2>
            </div>
            <div className="col-lg-7">
              {VALUES.map((value) => (
                <div className="cj-value-card" key={value.title}>
                  <div className="cj-value-card__icon">
                    <i className={`bi ${value.icon}`} />
                  </div>
                  <div>
                    <h3 className="h6 mb-1">{value.title}</h3>
                    <p className="text-muted mb-0">{value.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- skills */}
      <section className="cj-section bg-surface-secondary">
        <div className="container">
          <span className="cj-eyebrow mb-3">Toolkit</span>
          <h2 className="h3 font-bolder mb-5">What I work with</h2>
          <div className="row g-4">
            {skills?.map((group) => (
              <div className="col-md-6 col-lg-3" key={group.id}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  {group.icon && <i className={`bi ${group.icon} text-${group.accent}`} />}
                  <h3 className="h6 mb-0">{group.name}</h3>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className={`badge bg-${group.accent} bg-opacity-10 text-${group.accent} rounded-pill`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- experience */}
      <section className="cj-section cj-section--lg">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <span className="cj-eyebrow mb-3">Experience</span>
              <h2 className="h3 font-bolder mb-6">Where I have worked, and what came out of it</h2>

              <div className="cj-timeline">
                {workHistory.map((role) => (
                  <RoleItem key={role.id} role={role} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ education */}
      {education.length > 0 && (
        <section className="cj-section bg-surface-secondary">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <span className="cj-eyebrow mb-3">Education &amp; qualifications</span>
                <h2 className="h3 font-bolder mb-6">Formal training behind the work</h2>

                <div className="row g-4">
                  {education.map((role) => (
                    <div className="col-md-6" key={role.id}>
                      <div className="card border shadow-none h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-start gap-3">
                            <div className="cj-value-card__icon flex-shrink-0">
                              <i className="bi bi-mortarboard" />
                            </div>
                            <div>
                              <h3 className="h6 mb-1">{role.title}</h3>
                              <p className="text-sm text-primary fw-semibold mb-1">
                                {role.organisation}
                              </p>
                              <p className="text-xs text-muted mb-0">
                                {formatRange(role.started_on, role.ended_on, role.is_current)}
                                {role.location && ` · ${role.location}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function RoleItem({ role }: { role: ExperienceRow }) {
  return (
    <div className={`cj-timeline-item${role.is_current ? '' : ' cj-timeline-item--muted'}`}>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
        <h3 className="h5 mb-0">{role.title}</h3>
        <span className="text-xs text-muted">
          {formatRange(role.started_on, role.ended_on, role.is_current)}
        </span>
      </div>
      <p className="text-sm text-primary fw-semibold mb-3">
        {role.organisation}
        {role.location && <span className="text-muted fw-normal"> · {role.location}</span>}
      </p>
      {role.summary && <p className="text-muted mb-3">{role.summary}</p>}

      {role.achievements.length > 0 && (
        <div className="cj-chip-list mb-3">
          {role.achievements.map((achievement) => (
            <div className="cj-chip" key={achievement}>
              <i className="bi bi-check-circle-fill" />
              <span>{achievement}</span>
            </div>
          ))}
        </div>
      )}

      {role.stack.length > 0 && (
        <div className="d-flex flex-wrap gap-1">
          {role.stack.map((item) => (
            <span key={item} className="badge bg-secondary bg-opacity-10 text-muted rounded-pill text-xs">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
