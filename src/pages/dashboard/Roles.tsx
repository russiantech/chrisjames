import { useRoles } from '@/api/hooks';

export function Roles() {
  const { data, isLoading } = useRoles();

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <h1 className="h3 mb-2">Roles and permissions</h1>
      <p className="text-muted mb-5">
        Permissions are stored as a list on each role, so new roles can be created
        without a migration.
      </p>

      <div className="d-flex flex-column gap-4">
        {data?.map((role) => (
          <div className="card border shadow-none" key={role.id}>
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <h2 className="h6 mb-0">{role.label}</h2>
                <code className="text-xs text-muted">{role.name}</code>
                {role.is_superuser && (
                  <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                    Superuser
                  </span>
                )}
                {role.is_system && (
                  <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill">
                    Built in
                  </span>
                )}
              </div>

              {role.description && <p className="text-sm text-muted mb-3">{role.description}</p>}

              {role.is_superuser ? (
                <p className="text-sm text-muted mb-0">Holds every permission implicitly.</p>
              ) : (
                <div className="d-flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="badge bg-primary bg-opacity-10 text-primary rounded-pill text-xs"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
