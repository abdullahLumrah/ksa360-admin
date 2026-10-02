"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, mediaUrl, type Page } from "@/lib/api";
import { Shell } from "@/components/shell";
import { PageHeader, Thumb } from "@/components/ui";

type Field = { key: string; label: string; multiline?: boolean };

function cell(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (key === "image") {
    return <Thumb src={typeof value === "string" ? value : ""} />;
  }
  if (key === "video") {
    return value ? <span className="text-xs text-muted">{String(value)}</span> : "—";
  }
  const text = value == null ? "" : String(value);
  return text.length > 64 ? `${text.slice(0, 64)}…` : text || "—";
}

export function ResourceDesk({
  title,
  hint,
  path,
  fields,
  columns,
}: {
  title: string;
  hint: string;
  path: string;
  fields: Field[];
  columns: Array<{ key: string; label: string }>;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<Record<string, unknown>> | null>(null);
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page, query = q) {
    const res = await api<Page<Record<string, unknown>>>(
      `${path}?q=${encodeURIComponent(query)}&page=${nextPage}&limit=20`,
    );
    setData(res);
    setPage(nextPage);
  }

  useEffect(() => {
    load(0, "").catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!edit?.id) return;
    setError("");
    setBusy(true);
    try {
      await api(`${path}/${edit.id}`, { method: "PATCH", body: JSON.stringify(edit) });
      setEdit(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this record from the database?")) return;
    await api(`${path}/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <Shell>
      <PageHeader kicker="Catalog" title={title} hint={hint} />
      <div className="flex gap-3">
        <input
          className="field max-w-md"
          placeholder="Search name, city, or kind"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(0, q)}
        />
        <button className="btn btn-ghost" onClick={() => load(0, q)}>
          Search
        </button>
      </div>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      <div className="panel table-wrap mt-6 overflow-hidden">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((row) => (
              <tr key={String(row.id)}>
                {columns.map((col) => (
                  <td key={col.key}>{cell(row, col.key)}</td>
                ))}
                <td className="text-right whitespace-nowrap">
                  <button className="btn btn-ghost mr-2" onClick={() => setEdit(row)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(String(row.id))}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
          <span>{data?.total ?? 0} records</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}>
              Prev
            </button>
            <button
              className="btn btn-ghost"
              disabled={(page + 1) * 20 >= (data?.total || 0)}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {edit ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40 px-6">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-lg overflow-auto p-6">
            <h2 className="display text-[26px]">Edit</h2>
            {typeof edit.image === "string" && edit.image ? (
              <img src={mediaUrl(String(edit.image))} alt="" className="mt-4 h-36 w-full rounded-[20px] object-cover" />
            ) : null}
            {fields.map((field) => (
              <label key={field.key} className="mt-4 block text-sm">
                {field.label}
                {field.multiline ? (
                  <textarea
                    className="field mt-2 min-h-24"
                    value={String(edit[field.key] ?? "")}
                    onChange={(e) => setEdit({ ...edit, [field.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className="field mt-2"
                    value={String(edit[field.key] ?? "")}
                    onChange={(e) => setEdit({ ...edit, [field.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <div className="mt-6 flex gap-3">
              <button className="btn btn-green" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>
                Close
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Shell>
  );
}
