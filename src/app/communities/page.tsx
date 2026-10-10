"use client";

import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";

type Community = {
  id: string;
  name: string;
  topic?: string;
  city?: string;
  creatorName?: string;
  memberCount?: number;
  postCount?: number;
  status?: string;
  description?: string;
  createdAt?: string;
};

export default function CommunitiesPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<Community> | null>(null);
  const [page, setPage] = useState(0);

  async function load(next = page, query = q) {
    const params = new URLSearchParams({
      page: String(next),
      limit: "24",
      ...(query ? { q: query } : {}),
    });
    setData(await api(`/admin/communities?${params}`));
    setPage(next);
  }

  useLiveRefresh(() => load(page, q), 5000);

  return (
    <Shell>
      <PageHeader
        kicker="Social"
        title="Communities"
        hint="Pages members create in the app. Post approval stays with the page owner — use Reports for abuse."
      />
      <div className="flex flex-wrap gap-3">
        <input
          className="field max-w-sm"
          placeholder="Search name, topic, city, owner"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(0)}
        />
        <button className="btn btn-ghost" onClick={() => load(0)}>
          Search
        </button>
      </div>
      <div className="panel table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Topic</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Posts</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="title-clamp">{item.name}</p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
                  ) : null}
                </td>
                <td>{item.topic || "—"}</td>
                <td>{item.creatorName || "—"}</td>
                <td>{item.memberCount ?? 0}</td>
                <td>{item.postCount ?? 0}</td>
                <td>
                  <span className={`pill pill-${item.status}`}>
                    {String(item.status || "").replaceAll("_", " ")}
                  </span>
                </td>
                <td className="whitespace-nowrap text-right">
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (!confirm(`Remove page “${item.name}”?`)) return;
                      await api(`/admin/communities/${item.id}`, { method: "DELETE" });
                      load(page);
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.items?.length ? <p className="p-6 text-sm text-muted">No communities yet.</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-ghost" disabled={page <= 0} onClick={() => load(page - 1)}>
          Prev
        </button>
        <button
          className="btn btn-ghost"
          disabled={!data || (page + 1) * (data.limit || 24) >= (data.total || 0)}
          onClick={() => load(page + 1)}
        >
          Next
        </button>
      </div>
    </Shell>
  );
}
