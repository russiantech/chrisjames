import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

/**
 * Route-level error boundary. React Router calls this instead of showing the
 * default white screen whenever a route's element throws during render.
 */
export function RouteError() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Something went wrong loading this page.';

  return (
    <div className="container py-14 text-center">
      <i className="bi bi-exclamation-triangle display-4 text-warning" />
      <h1 className="h3 mt-4 mb-2">{status ? `Error ${status}` : 'Something broke'}</h1>
      <p className="text-muted mb-5" style={{ maxWidth: 480, marginInline: 'auto' }}>
        {message}
      </p>
      <div className="d-flex justify-content-center gap-3">
        <button className="btn btn-primary rounded-pill px-4" onClick={() => window.location.reload()}>
          Reload
        </button>
        <Link className="btn btn-neutral rounded-pill px-4" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
