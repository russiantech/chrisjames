import { useEffect, useState } from 'react';

import { useSettings, useWriteSettings } from '@/api/hooks';

interface SettingRow {
  key: string;
  value: unknown;
  value_type: string;
  group: string;
  label: string;
  is_public: boolean;
  is_overridden: boolean;
}

export function Settings() {
  const { data, isLoading } = useSettings();
  const write = useWriteSettings();
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (data) {
      setDraft(
        Object.fromEntries((data as SettingRow[]).map((row) => [row.key, row.value])),
      );
    }
  }, [data]);

  if (isLoading || !data) return <p className="text-muted">Loading…</p>;

  const rows = data as SettingRow[];
  const groups = [...new Set(rows.map((row) => row.group))];

  const dirty = rows.some((row) => draft[row.key] !== row.value);

  return (
    <>
      <h1 className="h3 mb-2">Settings</h1>
      <p className="text-muted mb-5">
        These override the values in the environment file, and take effect immediately.
      </p>

      {groups.map((group) => (
        <div className="card border shadow-none mb-4" key={group}>
          <div className="card-header py-3">
            <h2 className="h6 mb-0 text-capitalize">{group}</h2>
          </div>
          <div className="card-body d-flex flex-column gap-4">
            {rows
              .filter((row) => row.group === group)
              .map((row) => (
                <div key={row.key}>
                  {row.value_type === 'bool' ? (
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={row.key}
                        checked={Boolean(draft[row.key])}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, [row.key]: event.target.checked }))
                        }
                      />
                      <label className="form-check-label" htmlFor={row.key}>
                        {row.label}
                        {row.is_public && (
                          <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill ms-2 text-xs">
                            public
                          </span>
                        )}
                      </label>
                    </div>
                  ) : (
                    <>
                      <label className="form-label" htmlFor={row.key}>
                        {row.label}
                      </label>
                      <input
                        id={row.key}
                        className="form-control"
                        type={row.value_type === 'int' ? 'number' : 'text'}
                        value={String(draft[row.key] ?? '')}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [row.key]:
                              row.value_type === 'int'
                                ? Number(event.target.value)
                                : event.target.value,
                          }))
                        }
                      />
                    </>
                  )}
                  <p className="text-xs text-muted mb-0 mt-1">
                    <code>{row.key}</code>
                    {row.is_overridden && ' · set here'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-primary rounded-pill px-5"
          disabled={!dirty || write.isPending}
          onClick={() => write.mutate(draft)}
        >
          {write.isPending ? 'Saving…' : 'Save settings'}
        </button>
        {write.isSuccess && !dirty && (
          <span className="text-sm text-success">{write.data.detail}</span>
        )}
      </div>
    </>
  );
}
