import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container py-14 text-center">
      <p className="display-1 font-bolder text-primary mb-0">404</p>
      <h1 className="h3 mt-3 mb-2">That page is not here</h1>
      <p className="text-muted mb-5">
        The link may be old, or the page may have moved.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link className="btn btn-primary rounded-pill px-4" to="/">
          Go home
        </Link>
        <Link className="btn btn-neutral rounded-pill px-4" to="/blog">
          Read the blog
        </Link>
      </div>
    </div>
  );
}
