import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext';

interface Props {
  children: ReactNode;
  /** Any one of these is enough. Omit to require only a signed-in account. */
  permissions?: string[];
}

export function RequirePermission({ children, permissions }: Props) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-10">
        <div className="spinner-border text-primary" role="status">
          <span className="cj-sr-only">Loading</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permissions && permissions.length > 0 && !can(...permissions)) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <i className="bi bi-shield-lock display-4 text-warning" />
          <h2 className="h3 mt-4">You do not have access to this page</h2>
          <p className="text-muted">
            Your account needs one of: <code>{permissions.join('</code>, <code>')}</code>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
