"use client";

import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";

type Job = {
  id: string;
  title: string;
  category?: string;
  companyName?: string;
  city?: string;
  employmentType?: string;
  salaryDisplay?: string;
  status?: string;
  source?: string;
  datePosted?: string;
  applyUrl?: string;
  summary?: string;
};

export default function JobsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<Page<Job> | null>(null);
  const [page, setPage] = useState(0);

  async function load(next = page, nextStatus = status, query = q) {
    const params = new URLSearchParams({
      page: String(next),
      limit: "24",
      ...(query ? { q: query } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
    });
    setData(await api(`/admin/jobs?${params}`));
    setPage(next);
  }

  useLiveRefresh(() => load(page, status, q), 4000);

  return (
    <Shell>
      <PageHeader
        kicker="Work"
        title="Jobs"
        hint="Every Saudi listing in the database. Employer posts stay in the Jobs queue until you approve them."
      />
      <div className="flex flex-wrap gap-3">
        <input
          className="field max-w-sm"
          placeholder="Search title, company, city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(0)}
        />
        <select
          className="field max-w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load(0, e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="published">published</option>
          <option value="awaiting_approval">awaiting approval</option>
          <option value="declined">declined</option>
        </select>
        <button className="btn btn-ghost" onClick={() => load(0)}>
          Search
        </button>
      </div>
      <div className="panel table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Category</th>
              <th>City</th>
              <th>Status</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((job) => (
              <tr key={job.id}>
                <td>
                  <p className="title-clamp">{job.title}</p>
                  {job.salaryDisplay ? <p className="mt-1 text-xs text-muted">{job.salaryDisplay}</p> : null}
                </td>
                <td>{job.companyName || "—"}</td>
                <td>{job.category || "—"}</td>
                <td>{job.city || "—"}</td>
                <td>
                  <span className={`pill pill-${job.status}`}>{String(job.status || "").replaceAll("_", " ")}</span>
                </td>
                <td>{job.source || "—"}</td>
                <td className="whitespace-nowrap text-right">
                  {job.applyUrl ? (
                    <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn btn-ghost mr-2 inline-block">
                      Apply link
                    </a>
                  ) : null}
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (!confirm("Delete this job?")) return;
                      await api(`/admin/jobs/${job.id}`, { method: "DELETE" });
                      load(page);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between px-4 py-3 text-sm text-muted">
          <span>{data?.total ?? 0} jobs</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}>
              Prev
            </button>
            <button
              className="btn btn-ghost"
              disabled={(page + 1) * 24 >= (data?.total || 0)}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
