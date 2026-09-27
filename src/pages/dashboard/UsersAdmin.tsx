import { useState } from 'react';

import {
  useAdminUsers,
  useDeactivateUser,
  useRoles,
  useUpdateAdminUser,
} from '@/api/hooks';

const STATUS_ACCENT: Record<string, string> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  deactivated: 'secondary',
};

export function UsersAdmin() {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({ q: q || undefined, role: roleFilter || undefined, page, perPage: 20 });
  const { data: roles } = useRoles();
  const updateUser = useUpdateAdminUser();
  const deactivate = useDeactivateUser();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  return (
    <>
      <h1 className="h3 mb-2">Users</h1>
      <p className="text-muted mb-5">
        Everyone with an account — search, change roles, or deactivate.
      </p>

      <div className="d-flex flex-wrap gap-2 mb-5">
        <input
          className="form-control w-auto flex-grow-1"
          style={{ minWidth: 220 }}
          placeholder="Search by name, username or e-mail…"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="form-select w-auto"
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.name}>{role.label}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {data && data.items.length === 0 && <p className="text-muted">No accounts match.</p>}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="avatar avatar-xs rounded-circle" />
                    ) : (
                      <div className="avatar avatar-xs rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="d-block text-sm fw-semibold">{user.display_name}</span>
                      <span className="d-block text-xs text-muted">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={user.roles[0]?.name ?? ''}
                    onChange={(event) =>
                      updateUser.mutate({ id: user.id, role_names: [event.target.value] })
                    }
                    disabled={updateUser.isPending}
                  >
                    {roles?.map((role) => (
                      <option key={role.id} value={role.name}>{role.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span
                    className={`badge rounded-pill text-capitalize bg-${STATUS_ACCENT[user.status] ?? 'secondary'} bg-opacity-10 text-${STATUS_ACCENT[user.status] ?? 'secondary'}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="text-sm text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="text-end">
                  {user.status !== 'deactivated' && (
                    confirmingId === user.id ? (
                      <span className="d-inline-flex gap-1">
                        <button
                          className="btn btn-sm btn-danger rounded-pill"
                          onClick={() => {
                            deactivate.mutate(user.id);
                            setConfirmingId(null);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-sm btn-link text-muted"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn btn-sm btn-link text-danger"
                        onClick={() => setConfirmingId(user.id)}
                      >
                        Deactivate
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <nav className="mt-4" aria-label="Users">
          <ul className="pagination">
            <li className={`page-item ${data.has_prev ? '' : 'disabled'}`}>
              <button className="page-link" onClick={() => setPage((p) => p - 1)}>Previous</button>
            </li>
            <li className="page-item disabled">
              <span className="page-link">Page {data.page} of {data.pages}</span>
            </li>
            <li className={`page-item ${data.has_next ? '' : 'disabled'}`}>
              <button className="page-link" onClick={() => setPage((p) => p + 1)}>Next</button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
